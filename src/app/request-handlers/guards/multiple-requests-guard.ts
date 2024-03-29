import { RequestHandlerGuard } from './request-handler-guard';
import type { ProcessedRequest } from 'app/data/processed-request';
import type { IMultipleRequests } from 'app/token-options/mixins/multiple-requests-mixin';
import type { TokenOption } from 'app/token-options/token-option';

export class MultipleRequestsGuard extends RequestHandlerGuard {
    constructor(private tokenOption: TokenOption & IMultipleRequests, private processedRequests: ProcessedRequest[]) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        let count = 0;
        for (const request of this.processedRequests) {
            if (!request.tokenOption) continue;
            if (!request.isApproved) continue;
            if (this.tokenOption.id == request.tokenOption.id) {
                count++;
            }
        }
        if (this.tokenOption.allowedRequestCnt != -1 && count >= this.tokenOption.allowedRequestCnt)
            onReject(
                this.tokenOption.allowedRequestCnt != 1
                    ? `You already have ${count} approved requests for this token option and cannot have more.`
                    : 'There is already an approved request for this token option.'
            );
    }
}
