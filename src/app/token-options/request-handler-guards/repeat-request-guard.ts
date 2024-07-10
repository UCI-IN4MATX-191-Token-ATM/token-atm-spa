import type { ProcessedRequest } from 'app/data/processed-request';
import type { TokenOption } from 'app/token-options/token-option';
import { RequestHandlerGuard } from './request-handler-guard';
import { WithdrawTokenOptionMixinDataDef } from 'app/token-options/mixins/withdraw-token-option-mixin';

export class RepeatRequestGuard extends RequestHandlerGuard {
    constructor(private tokenOption: TokenOption, private processedRequests: ProcessedRequest[]) {
        super();
    }
    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        let count = 0;
        for (const request of this.processedRequests) {
            if (!request.tokenOption) continue;
            if (!request.isApproved) continue;
            if (this.tokenOption.id == request.tokenOption.id) {
                count++;
            } else if (
                WithdrawTokenOptionMixinDataDef.is(request.tokenOption) &&
                request.tokenOption.withdrawTokenOptionId == this.tokenOption.id
            ) {
                if (count > 0) count--;
            }
        }
        if (count != 0) onReject('There is already an approved request for this token option.');
    }
}
