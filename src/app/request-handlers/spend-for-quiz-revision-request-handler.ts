import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { CanvasService } from 'app/services/canvas.service';
import { RepeatRequestGuard } from './guards/repeat-request-guard';
import { RequestHandlerGuardExecutor } from './guards/request-handler-guard-executor';
import { SufficientTokenBalanceGuard } from './guards/sufficient-token-balance-guard';
import { RequestHandler } from './request-handlers';
import { QuizMaxGradeThresholdGuard } from './guards/quiz-max-grade-threshold-guard';
import type { SpendForQuizRevisionTokenOption } from 'app/token-options/spend-for-quiz-revision-token-option';
import type { SpendForQuizRevisionRequest } from 'app/requests/spend-for-quiz-revision-request';
import { EndDateGuard } from './guards/end-date-guard';
import { HasQuizSubmissionGuard } from './guards/has-quiz-submission-guard';

@Injectable()
export class SpendForQuizRevisionRequestHandler extends RequestHandler<
    SpendForQuizRevisionTokenOption,
    SpendForQuizRevisionRequest
> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: SpendForQuizRevisionRequest
    ): Promise<ProcessedRequest> {
        const guardExecutor = new RequestHandlerGuardExecutor([
            new RepeatRequestGuard(request.tokenOption, studentRecord.processedRequests),
            new SufficientTokenBalanceGuard(studentRecord.tokenBalance, request.tokenOption.tokenBalanceChange),
            new EndDateGuard(request.submittedTime, request.tokenOption.endTime),
            new HasQuizSubmissionGuard(
                configuration.course.id,
                request.tokenOption.quizId,
                studentRecord.student.id,
                this.canvasService
            ),
            new QuizMaxGradeThresholdGuard(
                configuration.course.id,
                request.tokenOption.quizId,
                studentRecord.student.id,
                request.tokenOption.gradeThreshold,
                this.canvasService
            )
        ]);
        await guardExecutor.check();
        if (!guardExecutor.isRejected) {
            await this.canvasService.createAssignmentOverrideForStudent(
                configuration.course.id,
                request.tokenOption.assignmentId,
                studentRecord.student.id,
                `Token ATM - ${configuration.uid}`,
                request.tokenOption.newDueTime
            );
        }
        return new ProcessedRequest(
            configuration,
            request.tokenOption.id,
            request.tokenOption.name,
            request.student,
            !guardExecutor.isRejected,
            request.submittedTime,
            new Date(),
            guardExecutor.isRejected ? 0 : request.tokenOption.tokenBalanceChange,
            guardExecutor.message ?? '',
            request.tokenOption.group.id
        );
    }

    public get type(): string {
        return 'spend-for-quiz-revision';
    }
}
