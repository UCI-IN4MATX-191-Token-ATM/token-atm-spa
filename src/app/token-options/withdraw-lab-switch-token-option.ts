import type { TokenOptionGroup } from 'app/data/token-option-group';
import { SpendForLabSwitchTokenOption } from './spend-for-lab-switch-token-option';
import type { TokenOption } from './token-option';
import { WithdrawTokenOption } from './withdraw-token-option';

export class WithdrawLabSwitchTokenOption extends WithdrawTokenOption<SpendForLabSwitchTokenOption> {
    protected validateTokenOptionType(tokenOption: TokenOption): boolean {
        return tokenOption instanceof SpendForLabSwitchTokenOption;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(group: TokenOptionGroup, data: any): WithdrawLabSwitchTokenOption {
        return new WithdrawLabSwitchTokenOption(...super.resolveWithdrawTokenOption(group, data));
    }
}
