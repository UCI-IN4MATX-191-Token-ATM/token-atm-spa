import type { TokenOptionGroup } from 'app/data/token-option-group';
import { SpendForLabDataTokenOption } from './spend-for-lab-data-token-option';
import type { TokenOption } from './token-option';
import { WithdrawTokenOption } from './withdraw-token-option';

export class WithdrawLabDataTokenOption extends WithdrawTokenOption<SpendForLabDataTokenOption> {
    protected validateTokenOptionType(tokenOption: TokenOption): boolean {
        return tokenOption instanceof SpendForLabDataTokenOption;
    }

    public get startTime(): Date | undefined {
        return this.withdrawTokenOption?.startTime;
    }

    public get endTime(): Date | undefined {
        return this.withdrawTokenOption?.endTime;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(group: TokenOptionGroup, data: any): WithdrawLabDataTokenOption {
        return new WithdrawLabDataTokenOption(...super.resolveWithdrawTokenOption(group, data));
    }
}
