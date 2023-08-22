import * as t from 'io-ts';
import { Constructor, DateDef } from 'app/utils/mixin-helper';

export const NewDueTimeMixinDataDef = t.strict({
    newDueTime: DateDef
});

export type NewDueTimeMixinData = t.TypeOf<typeof NewDueTimeMixinDataDef>;
export type RawNewDueTimeMixinData = t.OutputOf<typeof NewDueTimeMixinDataDef>;

export type INewDueTime = NewDueTimeMixinData;

export function NewDueTimeMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements INewDueTime {
        newDueTime = new Date();
    };
}
