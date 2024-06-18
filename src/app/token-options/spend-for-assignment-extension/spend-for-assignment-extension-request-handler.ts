import type { SpendForAssignmentExtensionTokenOption } from 'app/token-options/spend-for-assignment-extension/spend-for-assignment-extension-token-option';
import { RequestHandler } from '../request-handlers';
import { Inject, Injectable } from '@angular/core';
import { CanvasService } from 'app/services/canvas.service';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { ProcessedRequest } from 'app/data/processed-request';
import { RequestHandlerGuardExecutor } from '../request-handler-guards/request-handler-guard-executor';
import { RepeatRequestGuard } from '../request-handler-guards/repeat-request-guard';
import { SufficientTokenBalanceGuard } from '../request-handler-guards/sufficient-token-balance-guard';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMRequest } from 'app/token-options/token-atm-request';

type SpendForAssignmentExtensionRequest = TokenATMRequest<SpendForAssignmentExtensionTokenOption>;

@Injectable()
export class SpendForAssignmentExtensionRequestHandler extends RequestHandler<
    SpendForAssignmentExtensionTokenOption,
    SpendForAssignmentExtensionRequest
> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: SpendForAssignmentExtensionRequest
    ): Promise<ProcessedRequest> {
        const guardExecutor = new RequestHandlerGuardExecutor([
            new RepeatRequestGuard(request.tokenOption, studentRecord.processedRequests),
            new SufficientTokenBalanceGuard(studentRecord.tokenBalance, request.tokenOption.tokenBalanceChange)
        ]);
        await guardExecutor.check();
        if (!guardExecutor.isRejected) {
            await this.canvasService.extendAssignmentForStudent(
                configuration.course.id,
                request.tokenOption.assignmentId,
                request.student.id,
                `Token ATM - ${configuration.uid}`
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
        return 'spend-for-assignment-extension';
    }
}
