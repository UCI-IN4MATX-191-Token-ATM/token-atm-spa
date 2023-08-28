import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export const InternalExcludeTokenOptionIdsDef = t.array(t.number);

export const ExcludeTokenOptionIdsDef = new t.Type<number[], number[] | undefined, unknown>(
    'ExcludeTokenOptionIds',
    InternalExcludeTokenOptionIdsDef.is,
    (v, ctx) => {
        if (v == undefined) return t.success([]);
        return InternalExcludeTokenOptionIdsDef.validate(v, ctx);
    },
    (v) => (v.length == 0 ? undefined : InternalExcludeTokenOptionIdsDef.encode(v))
);

export const ExcludeTokenOptionIdsMixinDataDef = t.strict({
    excludeTokenOptionIds: ExcludeTokenOptionIdsDef
});

export type ExcludeTokenOptionIdsMixinData = t.TypeOf<typeof ExcludeTokenOptionIdsMixinDataDef>;
export type RawExcludeTokenOptionIdsMixinData = t.OutputOf<typeof ExcludeTokenOptionIdsMixinDataDef>;

export type IExcludeTokenOptionIds = ExcludeTokenOptionIdsMixinData & IGridViewDataSource;

export function ExcludeTokenOptionIdsMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IExcludeTokenOptionIds {
        excludeTokenOptionIds = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'Mutually Exclusive with',
                type: 'string',
                value: this.excludeTokenOptionIds.join(', ')
            }));
        }
    };
}
