import { Inject, Injectable } from '@angular/core';
import { RequestHandler } from './request-handlers';
import type { SpendForAdditionalAssignmentTimeRequest } from 'app/requests/spend-for-additional-assignment-time-request';
import type { SpendForAdditionalAssignmentTimeTokenOption } from 'app/token-options/spend-for-additional-assignment-time-token-option';
import { CanvasService } from 'app/services/canvas.service';
import type { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { RequestHandlerGuardExecutor } from './guards/request-handler-guard-executor';
import { MultipleRequestsGuard } from './guards/multiple-requests-guard';
import { ExcludeTokenOptionsGuard } from './guards/exclude-token-options-guard';
import { SufficientTokenBalanceGuard } from './guards/sufficient-token-balance-guard';

@Injectable()
export class SpendForAdditionalAssignmentTimeRequestHandler extends RequestHandler<
    SpendForAdditionalAssignmentTimeTokenOption,
    SpendForAdditionalAssignmentTimeRequest
> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: SpendForAdditionalAssignmentTimeRequest
    ): Promise<ProcessedRequest> {
        const guardExecutor = new RequestHandlerGuardExecutor([
            new MultipleRequestsGuard(request.tokenOption, studentRecord.processedRequests),
            new ExcludeTokenOptionsGuard(request.tokenOption.excludeTokenOptionIds, studentRecord.processedRequests),
            new SufficientTokenBalanceGuard(studentRecord.tokenBalance, request.tokenOption.tokenBalanceChange)
        ]);
        await guardExecutor.check();
        this.canvasService;
        configuration;
        studentRecord;
        request;
        // TODO: Complete Handler (Add Durations to selected times)
        throw new Error('Method not implemented.');
    }

    public get type(): string {
        return 'spend-for-additional-assignment-time';
    }
}
