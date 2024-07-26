import { RequestHandlerGuard } from './request-handler-guard';

export class SufficientTokenBalanceGuard extends RequestHandlerGuard {
    constructor(private currentTokenBalance: number, private tokenBalanceChange: number) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        if (this.currentTokenBalance + this.tokenBalanceChange < 0)
            onReject(
                `Insufficient token balance (need ${Math.abs(this.tokenBalanceChange)}, have ${
                    this.currentTokenBalance
                })`
            );
    }
}
