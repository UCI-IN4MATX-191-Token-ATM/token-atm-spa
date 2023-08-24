import type { Constructor } from 'app/utils/mixin-helper';
import type { IWithdrawTokenOption } from './withdraw-token-option-mixin';
import type { ITokenOption } from './token-option-mixin';
import type { IMultipleSectionEndTime } from './multiple-section-end-time-mixin';
import type { MultipleSectionDateMatcher } from 'app/utils/multiple-section-date-matcher';

export interface IWithdrawTokenOptionMultipleSectionEndTime {
    endTime: Date | MultipleSectionDateMatcher | undefined;
}

export function WithdrawTokenOptionMultipleSectionEndTimeMixin<
    TBase extends Constructor<IWithdrawTokenOption<IMultipleSectionEndTime & ITokenOption>>
>(Base: TBase) {
    return class extends Base implements IWithdrawTokenOptionMultipleSectionEndTime {
        public set endTime(_: Date | MultipleSectionDateMatcher | undefined) {
            throw new Error('Cannot set Until Date/Time for Withdraw Token Option');
        }

        public get endTime(): Date | MultipleSectionDateMatcher | undefined {
            return this.withdrawTokenOption ? this.withdrawTokenOption.endTime : undefined;
        }
    };
}
