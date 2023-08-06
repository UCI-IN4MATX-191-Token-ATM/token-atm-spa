import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';

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

export type IExcludeTokenOptionIds = ExcludeTokenOptionIdsMixinData;

export function ExcludeTokenOptionIdsMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements IExcludeTokenOptionIds {
        excludeTokenOptionIds = [];
    };
}
