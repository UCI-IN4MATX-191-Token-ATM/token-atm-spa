import * as t from 'io-ts';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';
import type { Constructor } from 'app/utils/mixin-helper';

export const MultipleReqeustsMixinDataDef = t.strict({
    allowedReqeustCnt: t.number
});

export type MultipleReqeustsMixinData = t.TypeOf<typeof MultipleReqeustsMixinDataDef>;

export type IMultipleReqeusts = MultipleReqeustsMixinData & IGridViewDataSource;

export function MultipleReqeustsMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IMultipleReqeusts {
        allowedReqeustCnt = 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'Allowed Reqeusts Count',
                type: 'number',
                value: this.allowedReqeustCnt
            }));
        }
    };
}
