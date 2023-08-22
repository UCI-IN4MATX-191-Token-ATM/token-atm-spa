import type { Constructor } from 'app/utils/mixin-helper';
import type { IWithdrawTokenOption } from './withdraw-token-option-mixin';
import type { IStartTime } from './start-time-mixin';
import type { ITokenOption } from './token-option-mixin';

export interface IWithdrawTokenOptionStartTime {
    startTime: Date | undefined;
}

export function WithdrawTokenOptionStartTimeMixin<
    TBase extends Constructor<IWithdrawTokenOption<IStartTime & ITokenOption>>
>(Base: TBase) {
    return class extends Base implements IWithdrawTokenOptionStartTime {
        public set startTime(_: Date | undefined) {
            throw new Error('Cannot set Start Time for Withdraw Token Option');
        }

        public get startTime(): Date | undefined {
            return this.withdrawTokenOption ? this.withdrawTokenOption.startTime : undefined;
        }
    };
}
