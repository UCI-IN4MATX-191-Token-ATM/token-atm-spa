import * as t from 'io-ts';
import { Constructor, DateDef } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export const EndTimeMixinDataDef = t.strict({
    endTime: DateDef
});

export type EndTimeMixinData = t.TypeOf<typeof EndTimeMixinDataDef>;
export type RawEndTimeMixinData = t.OutputOf<typeof EndTimeMixinDataDef>;

export type IEndTime = EndTimeMixinData & IGridViewDataSource;

export function EndTimeMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IEndTime {
        endTime = new Date();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'End At',
                type: 'date',
                value: this.endTime
            }));
        }
    };
}
