import * as t from 'io-ts';
import { type Constructor, DateDef } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export const StartTimeMixinDataDef = t.strict({
    startTime: DateDef
});

export type StartTimeMixinData = t.TypeOf<typeof StartTimeMixinDataDef>;
export type RawStartTimeMixinData = t.OutputOf<typeof StartTimeMixinDataDef>;

export type IStartTime = StartTimeMixinData & IGridViewDataSource;

export function StartTimeMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IStartTime {
        startTime = new Date();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'Can Request From',
                type: 'date',
                value: this.startTime
            }));
        }
    };
}
