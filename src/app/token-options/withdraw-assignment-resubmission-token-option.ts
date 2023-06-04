import type { TokenOptionGroup } from 'app/data/token-option-group';
import { SpendForAssignmentResubmissionTokenOption } from './spend-for-assignment-resubmission-token-option';
import type { TokenOption } from './token-option';
import { WithdrawTokenOption } from './withdraw-token-option';

export class WithdrawAssignmentResubmissionTokenOption extends WithdrawTokenOption<SpendForAssignmentResubmissionTokenOption> {
    protected validateTokenOptionType(tokenOption: TokenOption): boolean {
        return tokenOption instanceof SpendForAssignmentResubmissionTokenOption;
    }

    public get startTime(): Date | undefined {
        return this.withdrawTokenOption?.startTime;
    }

    public get endTime(): Date | undefined {
        return this.withdrawTokenOption?.endTime;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(group: TokenOptionGroup, data: any): WithdrawAssignmentResubmissionTokenOption {
        return new WithdrawAssignmentResubmissionTokenOption(...super.resolveWithdrawTokenOption(group, data));
    }
}
