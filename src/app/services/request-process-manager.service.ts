import { Inject, Injectable } from '@angular/core';
import type { QuizSubmission } from 'app/data/quiz-submission';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { RequestHandlerRegistry } from 'app/request-handlers/request-handler-registry';
import { RequestResolverRegistry } from 'app/request-resolvers/request-resolver-registry';
import type { TokenATMRequest } from 'app/requests/token-atm-request';
import type { TokenOption } from 'app/token-options/token-option';
import { compareAsc } from 'date-fns';
import { BehaviorSubject, Observable } from 'rxjs';
import { CanvasService } from './canvas.service';
import { RawRequestFetcherService } from './raw-request-fetcher.service';
import { StudentRecordManagerService } from './student-record-manager.service';

@Injectable({
    providedIn: 'root'
})
export class RequestProcessManagerService {
    private _isRunning = false;
    private _isStopTriggered = false;

    constructor(
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(RawRequestFetcherService) private rawRequestFetcherService: RawRequestFetcherService,
        @Inject(RequestResolverRegistry) private requestResolverRegistry: RequestResolverRegistry,
        @Inject(StudentRecordManagerService) private studentRecordManagerService: StudentRecordManagerService,
        @Inject(RequestHandlerRegistry) private requestHandlerRegistry: RequestHandlerRegistry
    ) {}

    public startRequestProcessing(configuration: TokenATMConfiguration): Observable<[number, string]> {
        const result = new BehaviorSubject<[number, string]>([0, 'Request processing started']);
        this.runRequestProcessing(configuration, result);
        return result;
    }

    public stopRequestProcessing(): void {
        if (!this.isRunning) return;
        this._isStopTriggered = true;
    }

    private finishRequestProcessing(progressUpdate: BehaviorSubject<[number, string]>): void {
        this._isRunning = false;
        this._isStopTriggered = false;
        progressUpdate.complete();
    }

    public async runRequestProcessing(
        configuration: TokenATMConfiguration,
        progressUpdate: BehaviorSubject<[number, string]>
    ): Promise<void> {
        this._isRunning = true;
        this._isStopTriggered = false;
        const quizSubmissionMap = new Map<string, Map<string, [TokenOptionGroup, QuizSubmission]>>();
        const assignmentIdMap = new Map<string, string>();
        let submissionCnt = 0;
        for (const group of configuration.tokenOptionGroups) {
            assignmentIdMap.set(
                group.quizId,
                await this.canvasService.getAssignmentIdByQuizId(configuration.course.id, group.quizId)
            );
            for await (const submission of await this.canvasService.getQuizSubmissions(
                configuration.course.id,
                group.quizId
            )) {
                if (!quizSubmissionMap.has(submission.studentId))
                    quizSubmissionMap.set(submission.studentId, new Map<string, [TokenOptionGroup, QuizSubmission]>());
                quizSubmissionMap.get(submission.studentId)?.set(group.quizId, [group, submission]);
                submissionCnt++;
                progressUpdate.next([
                    0,
                    `Gathering submissions: Gathered ${this.countAndNoun(submissionCnt, 'submission')}`
                ]);
                if (this._isStopTriggered) {
                    this.finishRequestProcessing(progressUpdate);
                    return;
                }
            }
        }
        const allRequests: [StudentRecord, TokenATMRequest<TokenOption>[]][] = [];
        let studentCnt = 0,
            requestCnt = 0;
        for await (const student of await this.canvasService.getCourseStudentEnrollments(configuration.course.id)) {
            if (!quizSubmissionMap.has(student.id)) continue;
            const quizSubmissions = quizSubmissionMap.get(student.id);
            if (!quizSubmissions) continue;
            let hasPendingRequest = false;
            const studentRecord = await this.studentRecordManagerService.getStudentRecord(configuration, student);
            if (this._isStopTriggered) {
                this.finishRequestProcessing(progressUpdate);
                return;
            }
            const tmpAllRequests: TokenATMRequest<TokenOption>[] = [];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [_, [tokenOptionGroup, quizSubmission]] of quizSubmissions) {
                for (
                    let curAttempt = studentRecord.getProcessedAttempts(tokenOptionGroup.id) + 1;
                    curAttempt <= quizSubmission.attempt;
                    curAttempt++
                ) {
                    const quizSubmissionDetail = await this.rawRequestFetcherService.fetchRawRequest(
                        configuration,
                        tokenOptionGroup,
                        student,
                        quizSubmission.id,
                        curAttempt,
                        assignmentIdMap.get(tokenOptionGroup.quizId)
                    );
                    tmpAllRequests.push(
                        await this.requestResolverRegistry.resolveRequest(tokenOptionGroup, quizSubmissionDetail)
                    );
                    if (!hasPendingRequest) {
                        hasPendingRequest = true;
                        studentCnt++;
                    }
                    requestCnt++;
                    progressUpdate.next([
                        0,
                        `Retreiving requests: Retreived` +
                            ` ${this.countAndNoun(requestCnt, 'request')}` +
                            ` from ${this.countAndNoun(studentCnt, 'student')}`
                    ]);
                    if (this._isStopTriggered) {
                        this.finishRequestProcessing(progressUpdate);
                        return;
                    }
                }
            }
            if (hasPendingRequest) allRequests.push([studentRecord, tmpAllRequests]);
        }
        let processedStudentCnt = 0,
            processedRequestCnt = 0;
        for (const [studentRecord, requests] of allRequests) {
            processedStudentCnt++;
            for (const request of requests.sort((a, b) => compareAsc(a.submittedTime, b.submittedTime))) {
                const processedRequest = await this.requestHandlerRegistry.handleRequest(
                    configuration,
                    studentRecord,
                    request
                );
                await this.studentRecordManagerService.logProcessedRequest(
                    configuration,
                    studentRecord,
                    processedRequest
                );
                processedRequestCnt++;
                progressUpdate.next([
                    (processedRequestCnt * 100) / requestCnt,
                    this.progressString(requestCnt, studentCnt, processedRequestCnt, processedStudentCnt)
                ]);
                if (this._isStopTriggered) {
                    this.finishRequestProcessing(progressUpdate);
                    return;
                }
            }
        }
        this.finishRequestProcessing(progressUpdate);
    }

    private countAndNoun(count: number, noun: string) {
        const pluralize = (word: string, count: number): string => {
            return word + (count == 1 ? '' : 's');
        };
        return `${count} ${pluralize(noun, count)}`;
    }

    private progressString(
        requestCnt: number,
        studentCnt: number,
        processedRequestCnt: number,
        processedStudentCnt: number
    ): string {
        const countAndNoun = this.countAndNoun;
        const template = (rC: number, sC: number, pRC: number, pSC: number): string => {
            return (
                `Processing Requests: Processed ${countAndNoun(pRC, 'request')}` +
                ` for ${countAndNoun(pSC, 'student')},` +
                ` ${countAndNoun(rC - pRC, 'request')} from` +
                ` ${countAndNoun(sC - pSC + 1, 'student')} remaining`
            );
        };
        return template(requestCnt, studentCnt, processedRequestCnt, processedStudentCnt);
    }

    public get isRunning(): boolean {
        return this._isRunning;
    }
}
