import { Inject, Injectable } from '@angular/core';
import { type ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { DefaultRequest } from 'app/token-options/token-atm-request';
import type { SpendForAdditionalAssignmentTimeTokenOption } from './spend-for-additional-assignment-time-token-option';
import { RequestHandler } from 'app/token-options/request-handler';
import { RequestHandlerGuardExecutor } from '../request-handler-guards/request-handler-guard-executor';
import { MultipleRequestsGuard } from '../request-handler-guards/multiple-requests-guard';
import { ExcludeTokenOptionsGuard } from '../request-handler-guards/exclude-token-options-guard';
import { SufficientTokenBalanceGuard } from '../request-handler-guards/sufficient-token-balance-guard';
import { CanvasService } from 'app/services/canvas.service';

type SpendForAdditionalAssignmentTimeRequest = DefaultRequest<SpendForAdditionalAssignmentTimeTokenOption>;

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
        configuration;
        this.canvasService;
        // TODO: Complete Handler (Add Durations to selected times)
        throw new Error('Handle Method not implemented.');
        // return new ProcessedRequest(
        //     configuration,
        //     request.tokenOption.id,
        //     request.tokenOption.name,
        //     studentRecord.student,
        //     false, // TODO-Now: whether the request is approved
        //     request.submittedTime,
        //     new Date(), // when did the request get processed
        //     0, // TODO-Now: token balance change for student
        //     'Request handling logic for this type of token option has not been implemented yet!', // TODO-Now: description for the request processing result
        //     request.tokenOption.group.id
        // );
    }

    public get type(): string {
        return 'spend-for-additional-assignment-time';
    }
}
