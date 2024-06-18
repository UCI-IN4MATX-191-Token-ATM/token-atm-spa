import { Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenATMRequest } from 'app/token-options/token-atm-request';
import type { SpendForLabSwitchTokenOption } from 'app/token-options/spend-for-lab-switch/spend-for-lab-switch-token-option';
import { ExcludeTokenOptionsGuard } from '../request-handler-guards/exclude-token-options-guard';
import { RepeatRequestGuard } from '../request-handler-guards/repeat-request-guard';
import { RequestHandlerGuardExecutor } from '../request-handler-guards/request-handler-guard-executor';
import { SufficientTokenBalanceGuard } from '../request-handler-guards/sufficient-token-balance-guard';
import { RequestHandler } from '../request-handlers';

type SpendForLabSwitchRequest = TokenATMRequest<SpendForLabSwitchTokenOption>;

@Injectable()
export class SpendForLabSwitchRequestHandler extends RequestHandler<
    SpendForLabSwitchTokenOption,
    SpendForLabSwitchRequest
> {
    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: SpendForLabSwitchRequest
    ): Promise<ProcessedRequest> {
        const guardExecutor = new RequestHandlerGuardExecutor([
            new RepeatRequestGuard(request.tokenOption, studentRecord.processedRequests),
            new ExcludeTokenOptionsGuard(request.tokenOption.excludeTokenOptionIds, studentRecord.processedRequests),
            new SufficientTokenBalanceGuard(studentRecord.tokenBalance, request.tokenOption.tokenBalanceChange)
        ]);
        await guardExecutor.check();
        const message = guardExecutor.message ?? '';
        const isRejected = guardExecutor.isRejected;
        return new ProcessedRequest(
            configuration,
            request.tokenOption.id,
            request.tokenOption.name,
            request.student,
            !isRejected,
            request.submittedTime,
            new Date(),
            isRejected ? 0 : request.tokenOption.tokenBalanceChange,
            message,
            request.tokenOption.group.id
        );
    }

    public get type(): string {
        return 'spend-for-lab-switch';
    }
}
