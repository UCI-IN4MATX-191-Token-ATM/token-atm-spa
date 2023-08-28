import type { Constructor } from 'app/utils/mixin-helper';
import type { IWithdrawTokenOption } from './withdraw-token-option-mixin';
import type { ITokenOption } from './token-option-mixin';
import type { IEndTime } from './end-time-mixin';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export interface IWithdrawTokenOptionEndTime extends IGridViewDataSource {
    endTime: Date | undefined;
}

export function WithdrawTokenOptionEndTimeMixin<
    TBase extends Constructor<IWithdrawTokenOption<IEndTime & ITokenOption>>
>(Base: TBase) {
    return class extends Base implements IWithdrawTokenOptionEndTime {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() =>
                this.endTime
                    ? {
                          colName: 'End At',
                          type: 'date',
                          value: this.endTime
                      }
                    : undefined
            );
        }

        public set endTime(_: Date | undefined) {
            throw new Error('Cannot set Available Until Date/Time for Withdraw Token Option');
        }

        public get endTime(): Date | undefined {
            return this.withdrawTokenOption ? this.withdrawTokenOption.endTime : undefined;
        }
    };
}
