import * as t from 'io-ts';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';
import type { Constructor } from 'app/utils/mixin-helper';

export const MultipleRequestsMixinDataDef = t.strict({
    allowedRequestCnt: t.number
});

export type MultipleRequestsMixinData = t.TypeOf<typeof MultipleRequestsMixinDataDef>;

export type IMultipleRequests = MultipleRequestsMixinData & IGridViewDataSource;

export function MultipleRequestsMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IMultipleRequests {
        allowedRequestCnt = 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'Allowed Requests Count',
                type: 'number',
                value: this.allowedRequestCnt
            }));
        }
    };
}
