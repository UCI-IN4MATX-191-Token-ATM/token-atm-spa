import type { Constructor } from 'app/utils/mixin-helper';
import type { IWithdrawTokenOption } from './withdraw-token-option-mixin';
import type { ITokenOption } from './token-option-mixin';
import type { IMultipleSectionEndTime } from './multiple-section-end-time-mixin';
import { MultipleSectionDateMatcher } from 'app/utils/multiple-section-date-matcher';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export interface IWithdrawTokenOptionMultipleSectionEndTime extends IGridViewDataSource {
    endTime: Date | MultipleSectionDateMatcher | undefined;
}

export function WithdrawTokenOptionMultipleSectionEndTimeMixin<
    TBase extends Constructor<IWithdrawTokenOption<IMultipleSectionEndTime & ITokenOption>>
>(Base: TBase) {
    return class extends Base implements IWithdrawTokenOptionMultipleSectionEndTime {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() =>
                this.endTime instanceof MultipleSectionDateMatcher
                    ? {
                          colName: 'Can Request Until (with exceptions)',
                          type: 'html',
                          value: this.endTime.toHTML()
                      }
                    : this.endTime instanceof Date
                    ? {
                          colName: 'Can Request Until',
                          type: 'date',
                          value: this.endTime
                      }
                    : undefined
            );
        }

        public set endTime(_: Date | MultipleSectionDateMatcher | undefined) {
            throw new Error('Cannot set Can Request Until Date/Time for Withdraw Token Option');
        }

        public get endTime(): Date | MultipleSectionDateMatcher | undefined {
            return this.withdrawTokenOption ? this.withdrawTokenOption.endTime : undefined;
        }
    };
}
