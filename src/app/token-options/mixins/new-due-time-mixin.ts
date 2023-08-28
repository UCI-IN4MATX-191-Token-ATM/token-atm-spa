import * as t from 'io-ts';
import { Constructor, DateDef } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export const NewDueTimeMixinDataDef = t.strict({
    newDueTime: DateDef
});

export type NewDueTimeMixinData = t.TypeOf<typeof NewDueTimeMixinDataDef>;
export type RawNewDueTimeMixinData = t.OutputOf<typeof NewDueTimeMixinDataDef>;

export type INewDueTime = NewDueTimeMixinData & IGridViewDataSource;

export function NewDueTimeMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements INewDueTime {
        newDueTime = new Date();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'Change Until Date/Time for Canvas Assignment/Quiz to',
                type: 'date',
                value: this.newDueTime
            }));
        }
    };
}
