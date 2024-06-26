import { Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenATMRequest } from 'app/token-options/token-atm-request';
import type { WithdrawLabSwitchTokenOption } from 'app/token-options/withdraw-lab-switch/withdraw-lab-switch-token-option';
import { HasApprovedRequestGuard } from '../request-handler-guards/has-approved-request-guard';
import { RequestHandlerGuardExecutor } from '../request-handler-guards/request-handler-guard-executor';
import { RequestHandler } from '../request-handler';

type WithdrawLabSwitchRequest = TokenATMRequest<WithdrawLabSwitchTokenOption>;

@Injectable()
export class WithdrawLabSwitchRequestHandler extends RequestHandler<
    WithdrawLabSwitchTokenOption,
    WithdrawLabSwitchRequest
> {
    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: WithdrawLabSwitchRequest
    ): Promise<ProcessedRequest> {
        let message = '';
        let isRejected = false;
        const withdrawTokenOption = request.tokenOption.withdrawTokenOption;
        if (!withdrawTokenOption) {
            message = 'The withdraw token option you requested is no longer valid.';
            isRejected = true;
        } else {
            const guardExecutor = new RequestHandlerGuardExecutor([
                new HasApprovedRequestGuard(withdrawTokenOption, studentRecord.processedRequests)
            ]);
            await guardExecutor.check();
            message = guardExecutor.message ?? '';
            isRejected = guardExecutor.isRejected;
        }
        if (!isRejected) {
            message =
                'You don’t have the proper permission to withdraw a lab switch request. This token option is only requestable by instructors on your behalf.';
            isRejected = true;
        }
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
        return 'withdraw-lab-switch';
    }
}
