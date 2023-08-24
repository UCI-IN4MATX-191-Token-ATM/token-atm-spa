import type { Constructor } from 'app/utils/mixin-helper';
import type { IWithdrawTokenOption } from './withdraw-token-option-mixin';
import type { ITokenOption } from './token-option-mixin';
import type { IEndTime } from './end-time-mixin';

export interface IWithdrawTokenOptionEndTime {
    endTime: Date | undefined;
}

export function WithdrawTokenOptionEndTimeMixin<
    TBase extends Constructor<IWithdrawTokenOption<IEndTime & ITokenOption>>
>(Base: TBase) {
    return class extends Base implements IWithdrawTokenOptionEndTime {
        public set endTime(_: Date | undefined) {
            throw new Error('Cannot set Available Until Date/Time for Withdraw Token Option');
        }

        public get endTime(): Date | undefined {
            return this.withdrawTokenOption ? this.withdrawTokenOption.endTime : undefined;
        }
    };
}
