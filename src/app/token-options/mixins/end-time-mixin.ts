import * as t from 'io-ts';
import { Constructor, DateDef } from 'app/utils/mixin-helper';

export const EndTimeMixinDataDef = t.strict({
    endTime: DateDef
});

export type EndTimeMixinData = t.TypeOf<typeof EndTimeMixinDataDef>;

export type IEndTime = EndTimeMixinData;

export function EndTimeMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements IEndTime {
        endTime = new Date();
    };
}
