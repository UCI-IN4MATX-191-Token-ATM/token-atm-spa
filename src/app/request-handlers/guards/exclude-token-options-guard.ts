import type { ProcessedRequest } from 'app/data/processed-request';
import { WithdrawTokenOption } from 'app/token-options/withdraw-token-option';
import { RequestHandlerGuard } from './request-handler-guard';

export class ExcludeTokenOptionsGuard extends RequestHandlerGuard {
    constructor(private excludeTokenOptionIds: number[], private processedRequests: ProcessedRequest[]) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        for (const tokenOptionId of this.excludeTokenOptionIds) {
            if (this.hasApprovedRequest(tokenOptionId)) {
                onReject(
                    'You have an approved request to another token option that is mutually exclusive with this token option.'
                );
                return;
            }
        }
    }

    private hasApprovedRequest(tokenOptionId: number): boolean {
        let count = 0;
        for (const request of this.processedRequests) {
            if (!request.tokenOption) continue;
            if (!request.isApproved) continue;
            if (tokenOptionId == request.tokenOption.id) {
                count++;
            } else if (
                request.tokenOption instanceof WithdrawTokenOption &&
                request.tokenOption.withdrawTokenOptionId == tokenOptionId
            ) {
                if (count > 0) count--;
            }
        }
        return count != 0;
    }
}
