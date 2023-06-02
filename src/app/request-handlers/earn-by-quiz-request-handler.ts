import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { EarnByQuizRequest } from 'app/requests/earn-by-quiz-request';
import { CanvasService } from 'app/services/canvas.service';
import type { EarnByQuizTokenOption } from 'app/token-options/earn-by-quiz-token-option';
import { QuizGradeThresholdGuard } from './guards/quiz-grade-threshold-guard';
import { RepeatRequestGuard } from './guards/repeat-request-guard';
import { RequestHandlerGuardExecutor } from './guards/request-handler-guard-executor';
import { StartDateGuard } from './guards/start-date-guard';
import { RequestHandler } from './request-handlers';

@Injectable()
export class EarnByQuizRequestHandler extends RequestHandler<EarnByQuizTokenOption, EarnByQuizRequest> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: EarnByQuizRequest
    ): Promise<ProcessedRequest> {
        const guardExecutor = new RequestHandlerGuardExecutor([
            new StartDateGuard(request.submittedTime, request.tokenOption.startTime),
            new QuizGradeThresholdGuard(
                configuration.course.id,
                request.tokenOption.quizId,
                request.student.id,
                request.tokenOption.gradeThreshold,
                this.canvasService
            ),
            new RepeatRequestGuard(request.tokenOption, studentRecord.processedRequests)
        ]);
        await guardExecutor.check();
        return new ProcessedRequest(
            configuration,
            request.tokenOption.id,
            request.tokenOption.name,
            request.student,
            !guardExecutor.isRejected,
            request.submittedTime,
            new Date(),
            guardExecutor.isRejected ? 0 : request.tokenOption.tokenBalanceChange,
            guardExecutor.message,
            request.tokenOption.group.id
        );
    }

    public get type(): string {
        return 'earn-by-quiz';
    }
}
