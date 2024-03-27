import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { QuizSubmission } from 'app/data/quiz-submission';
import type { Student } from 'app/data/student';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { RequestHandlerRegistry } from 'app/request-handlers/request-handler-registry';
import { RequestResolverRegistry } from 'app/request-resolvers/request-resolver-registry';
import type { TokenATMRequest } from 'app/requests/token-atm-request';
import type { TokenOption } from 'app/token-options/token-option';
import { compareAsc, format } from 'date-fns';
import { BehaviorSubject, Observable } from 'rxjs';
import { CanvasService } from './canvas.service';
import { QualtricsService } from './qualtrics.service';
import { RawRequestFetcherService } from './raw-request-fetcher.service';
import { StudentRecordManagerService } from './student-record-manager.service';
import { countAndNoun } from 'app/utils/pluralize';
import { QuestionProService } from './question-pro.service';

@Injectable({
    providedIn: 'root'
})
export class RequestProcessManagerService {
    private _isRunning = false;
    private _isStopTriggered = false;
    private static MAX_SUBMITTED_REQUEST_CNT = 200;

    constructor(
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(RawRequestFetcherService) private rawRequestFetcherService: RawRequestFetcherService,
        @Inject(RequestResolverRegistry) private requestResolverRegistry: RequestResolverRegistry,
        @Inject(StudentRecordManagerService) private studentRecordManagerService: StudentRecordManagerService,
        @Inject(RequestHandlerRegistry) private requestHandlerRegistry: RequestHandlerRegistry,
        @Inject(QualtricsService) private qualtricsService: QualtricsService,
        @Inject(QuestionProService) private questionProService: QuestionProService
    ) {}

    public startRequestProcessing(configuration: TokenATMConfiguration): Observable<[number, string]> {
        const result = new BehaviorSubject<[number, string]>([0, 'Request processing started']);
        // Intentionally not await since the BehaviorSubject needs to be return to the component
        this.runRequestProcessing(configuration, result);
        return result;
    }

    public stopRequestProcessing(): void {
        if (!this.isRunning) return;
        this._isStopTriggered = true;
    }

    private finishRequestProcessing(
        progressUpdate: BehaviorSubject<[number, string]>,
        completeObservable = true
    ): void {
        this._isRunning = false;
        this._isStopTriggered = false;
        this.qualtricsService.clearCache();
        this.questionProService.clearCache();
        if (completeObservable) progressUpdate.complete();
    }

    public async runRequestProcessing(
        configuration: TokenATMConfiguration,
        progressUpdate: BehaviorSubject<[number, string]>
    ): Promise<void> {
        this._isRunning = true;
        this._isStopTriggered = false;
        this.qualtricsService.clearCache();
        this.questionProService.clearCache();
        let quizSubmissionMap, assignmentIdMap;
        try {
            [quizSubmissionMap, assignmentIdMap] = await this.gatherQuizSubmissions(configuration, progressUpdate);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            progressUpdate.error(['Encountered an error while gathering students’ quiz submissions', err]);
            this.finishRequestProcessing(progressUpdate, false);
            return;
        }
        if (this._isStopTriggered) {
            this.finishRequestProcessing(progressUpdate);
            return;
        }
        const totalStudentCnt = quizSubmissionMap.size;
        let processedStudentCnt = 0,
            processedRequestCnt = 0;
        try {
            for await (const student of await this.canvasService.getCourseStudentEnrollments(configuration.course.id)) {
                if (!quizSubmissionMap.has(student.id)) {
                    continue;
                }
                let individualProcessedRequestCnt = 0;
                processedStudentCnt++;
                const quizSubmissions = quizSubmissionMap.get(student.id);
                if (!quizSubmissions) continue;
                let studentRecord, requests;
                try {
                    [studentRecord, requests] = await this.resolveRequestsForStudent(
                        configuration,
                        student,
                        progressUpdate,
                        quizSubmissions.values(),
                        assignmentIdMap
                    );
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (err: any) {
                    progressUpdate.error([
                        `Encountered an error while resolving requests for student ${
                            student.name + (student.email == '' ? '' : `(${student.email})`)
                        }`,
                        err
                    ]);
                    this.finishRequestProcessing(progressUpdate, false);
                    return;
                }
                if (this._isStopTriggered) {
                    this.finishRequestProcessing(progressUpdate);
                    return;
                }
                for (const request of requests) {
                    if (studentRecord.submittedRequestCnt >= RequestProcessManagerService.MAX_SUBMITTED_REQUEST_CNT)
                        break;
                    let processedRequest = undefined;
                    if (request instanceof ProcessedRequest) {
                        processedRequest = request;
                    } else {
                        try {
                            processedRequest = await this.requestHandlerRegistry.handleRequest(
                                configuration,
                                studentRecord,
                                request
                            );
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } catch (err: any) {
                            progressUpdate.error([
                                `Encountered an error while handling request to ${
                                    processedRequest ? processedRequest.tokenOptionName : request.tokenOption.name
                                } submitted at ${format(request.submittedTime, 'MMM dd, yyyy HH:mm:ss')} by student ${
                                    student.name + (student.email == '' ? '' : `(${student.email})`)
                                }`,
                                err
                            ]);
                            this.finishRequestProcessing(progressUpdate, false);
                            return;
                        }
                    }
                    try {
                        await this.studentRecordManagerService.logProcessedRequest(
                            configuration,
                            studentRecord,
                            processedRequest
                        );
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (err: any) {
                        progressUpdate.error([
                            `Encountered an error while logging request to ${
                                processedRequest.tokenOptionName
                            } submitted at ${format(
                                processedRequest.submittedTime,
                                'MMM dd, yyyy HH:mm:ss'
                            )} by student ${student.name + (student.email == '' ? '' : `(${student.email})`)}`,
                            err
                        ]);
                        this.finishRequestProcessing(progressUpdate, false);
                        return;
                    }
                    processedRequestCnt++;
                    individualProcessedRequestCnt++;
                    progressUpdate.next([
                        (processedStudentCnt * 100) / totalStudentCnt,
                        this.progressString(totalStudentCnt, processedRequestCnt, processedStudentCnt)
                    ]);
                    progressUpdate.next([
                        -1 - individualProcessedRequestCnt / requests.length,
                        `Processed ${countAndNoun(
                            individualProcessedRequestCnt,
                            'request'
                        )} for the current student, ${countAndNoun(
                            requests.length - individualProcessedRequestCnt,
                            'request'
                        )} remaining`
                    ]);
                    if (this._isStopTriggered) {
                        this.finishRequestProcessing(progressUpdate);
                        return;
                    }
                }
            }
            this.finishRequestProcessing(progressUpdate);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            progressUpdate.error(['Encountered an error while traversing the student list', err]);
            this.finishRequestProcessing(progressUpdate, false);
            return;
        }
    }

    private async gatherQuizSubmissions(
        configuration: TokenATMConfiguration,
        progressUpdate: BehaviorSubject<[number, string]>
    ): Promise<[Map<string, Map<string, [TokenOptionGroup, QuizSubmission]>>, Map<string, string>]> {
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
                    `Gathering submissions: Gathered ${countAndNoun(submissionCnt, 'submission')}`
                ]);
                if (this._isStopTriggered) {
                    return [quizSubmissionMap, assignmentIdMap];
                }
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [quizSubmissionMap, assignmentIdMap];
    }

    private async resolveRequestsForStudent(
        configuration: TokenATMConfiguration,
        student: Student,
        progressUpdate: BehaviorSubject<[number, string]>,
        quizSubmissions: IterableIterator<[TokenOptionGroup, QuizSubmission]>,
        assignmentIdMap: Map<string, string>
    ): Promise<[StudentRecord, (TokenATMRequest<TokenOption> | ProcessedRequest)[]]> {
        const studentRecord = await this.studentRecordManagerService.getStudentRecord(configuration, student);
        const requests: (TokenATMRequest<TokenOption> | ProcessedRequest)[] = [];
        if (studentRecord.submittedRequestCnt >= RequestProcessManagerService.MAX_SUBMITTED_REQUEST_CNT)
            return [studentRecord, requests];
        if (this._isStopTriggered) {
            return [studentRecord, requests];
        }
        let requestCnt = 0;
        for (const [group, quizSubmission] of quizSubmissions) {
            for (
                let curAttempt = studentRecord.getProcessedAttempts(group.id) + 1;
                curAttempt <= quizSubmission.attempt;
                curAttempt++
            ) {
                const quizSubmissionDetail = await this.rawRequestFetcherService.fetchRawRequest(
                    configuration,
                    group,
                    student,
                    quizSubmission.id,
                    curAttempt,
                    assignmentIdMap.get(group.quizId)
                );
                if (this._isStopTriggered) return [studentRecord, requests];
                if (!quizSubmissionDetail) continue;
                const request = await this.requestResolverRegistry.resolveRequest(group, quizSubmissionDetail);
                if (!request) {
                    requests.push(
                        new ProcessedRequest(
                            configuration,
                            -1,
                            'An Unrecognized Token Option',
                            student,
                            false,
                            quizSubmissionDetail.submittedTime,
                            new Date(),
                            0,
                            'The token option you made a request for cannot be recognized. You might have submitted the quiz without selecting an option from Question 1, or the token option you requested for is deleted, moved, or not configured properly yet.',
                            group.id
                        )
                    );
                } else requests.push(request);
                requestCnt++;
                progressUpdate.next([
                    -1,
                    `Resolving Requests: Resolved ${countAndNoun(requestCnt, 'request')} for the current student`
                ]);
                if (this._isStopTriggered) return [studentRecord, requests];
            }
        }
        return [studentRecord, requests.sort((a, b) => compareAsc(this.getSubmitTime(a), this.getSubmitTime(b)))];
    }

    public getSubmitTime(request: ProcessedRequest | TokenATMRequest<TokenOption>) {
        if (request instanceof ProcessedRequest) {
            return request.submittedTime;
        } else {
            return request.submittedTime;
        }
    }

    private progressString(studentCnt: number, processedRequestCnt: number, processedStudentCnt: number): string {
        const template = (sC: number, pRC: number, pSC: number): string => {
            return (
                `Processing Requests: Processed ${countAndNoun(pRC, 'request')}` +
                ` for ${countAndNoun(pSC, 'student')},` +
                ` ${countAndNoun(sC - pSC + 1, 'student')} remaining`
            );
        };
        return template(studentCnt, processedRequestCnt, processedStudentCnt);
    }

    public get isRunning(): boolean {
        return this._isRunning;
    }
}
