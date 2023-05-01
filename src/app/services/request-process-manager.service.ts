import { Inject, Injectable } from '@angular/core';
import type { QuizSubmission } from 'app/data/quiz-submission';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { RequestHandlerRegistry } from 'app/request-handlers/request-handler-registry';
import { RequestResolverRegistry } from 'app/request-resolvers/request-resolver-registry';
import type { TokenATMRequest } from 'app/requests/token-atm-request';
import type { TokenOption } from 'app/token-options/token-option';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';
import { CanvasService } from './canvas.service';
import { RawRequestFetcherService } from './raw-request-fetcher.service';
import { StudentRecordManagerService } from './student-record-manager.service';

@Injectable({
    providedIn: 'root'
})
export class RequestProcessManagerService {
    private _isRunning = false;

    constructor(
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(RawRequestFetcherService) private rawRequestFetcherService: RawRequestFetcherService,
        @Inject(RequestResolverRegistry) private requestResolverRegistry: RequestResolverRegistry,
        @Inject(StudentRecordManagerService) private studentRecordManagerService: StudentRecordManagerService,
        @Inject(RequestHandlerRegistry) private requestHandlerRegistry: RequestHandlerRegistry
    ) {}

    public async startRequestProcessing(configuration: TokenATMConfiguration): Promise<void> {
        this._isRunning = true;
        const quizSubmissionMap = new Map<string, Map<string, [TokenOptionGroup, QuizSubmission]>>();
        const assignmentIdMap = new Map<string, string>();
        for (const group of configuration.tokenOptionGroups) {
            assignmentIdMap.set(
                group.quizId,
                await this.canvasService.getAssignmentIdByQuizId(configuration.course.id, group.quizId)
            );
            const submissions = await DataConversionHelper.convertAsyncIterableToList(
                await this.canvasService.getQuizSubmissions(configuration.course.id, group.quizId)
            );
            for (const submission of submissions) {
                if (!quizSubmissionMap.has(submission.studentId))
                    quizSubmissionMap.set(submission.studentId, new Map<string, [TokenOptionGroup, QuizSubmission]>());
                quizSubmissionMap.get(submission.studentId)?.set(group.quizId, [group, submission]);
            }
        }
        const allRequests: [StudentRecord, TokenATMRequest<TokenOption>[]][] = [];
        for await (const student of await this.canvasService.getCourseStudentEnrollments(configuration.course.id)) {
            if (!quizSubmissionMap.has(student.id)) continue;
            const quizSubmissions = quizSubmissionMap.get(student.id);
            if (!quizSubmissions) continue;
            const studentRecord = await this.studentRecordManagerService.getStudentRecord(configuration, student);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [_, [tokenOptionGroup, quizSubmission]] of quizSubmissions) {
                const requests: TokenATMRequest<TokenOption>[] = [];
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
                    requests.push(
                        await this.requestResolverRegistry.resolveRequest(tokenOptionGroup, quizSubmissionDetail)
                    );
                }
                allRequests.push([studentRecord, requests]);
            }
        }
        for (const [studentRecord, requests] of allRequests) {
            for (const request of requests) {
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
            }
        }
        this._isRunning = false;
    }

    public get isRunning(): boolean {
        return this._isRunning;
    }
}
