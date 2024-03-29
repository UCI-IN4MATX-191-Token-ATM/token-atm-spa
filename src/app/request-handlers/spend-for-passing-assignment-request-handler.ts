import type { SpendForPassingAssignmentRequest } from 'app/requests/spend-for-passing-assignment-request';
import type { SpendForPassingAssignmentTokenOption } from 'app/token-options/spend-for-passing-assignment-token-option';
import { RequestHandler } from './request-handlers';
import { Inject, Injectable } from '@angular/core';
import { CanvasService } from 'app/services/canvas.service';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { ProcessedRequest } from 'app/data/processed-request';
import { RequestHandlerGuardExecutor } from './guards/request-handler-guard-executor';
import { RepeatRequestGuard } from './guards/repeat-request-guard';
import { SufficientTokenBalanceGuard } from './guards/sufficient-token-balance-guard';
import type { StudentRecord } from 'app/data/student-record';
import { ExcludeTokenOptionsGuard } from './guards/exclude-token-options-guard';

@Injectable()
export class SpendForPassingAssignmentRequestHandler extends RequestHandler<
    SpendForPassingAssignmentTokenOption,
    SpendForPassingAssignmentRequest
> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: SpendForPassingAssignmentRequest
    ): Promise<ProcessedRequest> {
        const guardExecutor = new RequestHandlerGuardExecutor([
            new RepeatRequestGuard(request.tokenOption, studentRecord.processedRequests),
            new ExcludeTokenOptionsGuard(request.tokenOption.excludeTokenOptionIds, studentRecord.processedRequests),
            new SufficientTokenBalanceGuard(studentRecord.tokenBalance, request.tokenOption.tokenBalanceChange)
        ]);
        await guardExecutor.check();
        if (!guardExecutor.isRejected) {
            await this.canvasService.gradeSubmissionWithPercentage(
                configuration.course.id,
                studentRecord.student.id,
                request.tokenOption.assignmentId,
                request.tokenOption.gradeThreshold
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
        return 'spend-for-passing-assignment';
    }
}
