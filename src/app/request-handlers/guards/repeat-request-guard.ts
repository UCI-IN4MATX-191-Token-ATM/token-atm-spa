import type { ProcessedRequest } from 'app/data/processed-request';
import type { TokenOption } from 'app/token-options/token-option';
import { RequestHandlerGuard } from './request-handler-guard';

export class RepeatRequestGuard extends RequestHandlerGuard {
    constructor(private tokenOption: TokenOption, private processedRequests: ProcessedRequest[]) {
        super();
    }
    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        // TODO: handle withdraw
        for (const request of this.processedRequests) {
            if (!request.tokenOption) return;
            if (!request.isApproved) return;
            if (this.tokenOption.id == request.tokenOption.id) {
                onReject('There is already an approved request to this token option.');
                return;
            }
        }
    }
}
