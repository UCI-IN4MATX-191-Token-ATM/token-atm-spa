import type { SpendForPassingAssignmentTokenOption } from 'app/token-options/spend-for-passing-assignment/spend-for-passing-assignment-token-option';
import { RequestHandler } from '../request-handler';
import { Inject, Injectable } from '@angular/core';
import { CanvasService } from 'app/services/canvas.service';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { ProcessedRequest } from 'app/data/processed-request';
import { RequestHandlerGuardExecutor } from '../request-handler-guards/request-handler-guard-executor';
import { RepeatRequestGuard } from '../request-handler-guards/repeat-request-guard';
import { SufficientTokenBalanceGuard } from '../request-handler-guards/sufficient-token-balance-guard';
import type { StudentRecord } from 'app/data/student-record';
import { ExcludeTokenOptionsGuard } from '../request-handler-guards/exclude-token-options-guard';
import type { TokenATMRequest } from 'app/token-options/token-atm-request';

type SpendForPassingAssignmentRequest = TokenATMRequest<SpendForPassingAssignmentTokenOption>;

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
