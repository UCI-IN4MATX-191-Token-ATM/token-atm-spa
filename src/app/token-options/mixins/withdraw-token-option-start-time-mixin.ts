import type { Constructor } from 'app/utils/mixin-helper';
import type { IWithdrawTokenOption } from './withdraw-token-option-mixin';
import type { IStartTime } from './start-time-mixin';
import type { ITokenOption } from './token-option-mixin';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export interface IWithdrawTokenOptionStartTime extends IGridViewDataSource {
    startTime: Date | undefined;
}

export function WithdrawTokenOptionStartTimeMixin<
    TBase extends Constructor<IWithdrawTokenOption<IStartTime & ITokenOption>>
>(Base: TBase) {
    return class extends Base implements IWithdrawTokenOptionStartTime {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() =>
                this.startTime
                    ? {
                          colName: 'Can Request From',
                          type: 'date',
                          value: this.startTime
                      }
                    : undefined
            );
        }
        public set startTime(_: Date | undefined) {
            throw new Error('Cannot set Available From Date/Time for Withdraw Token Option');
        }

        public get startTime(): Date | undefined {
            return this.withdrawTokenOption ? this.withdrawTokenOption.startTime : undefined;
        }
    };
}
