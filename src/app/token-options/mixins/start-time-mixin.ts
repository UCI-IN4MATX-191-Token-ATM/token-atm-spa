import * as t from 'io-ts';
import { Constructor, DateDef } from 'app/utils/mixin-helper';

export const StartTimeMixinDataDef = t.strict({
    startTime: DateDef
});

export type StartTimeMixinData = t.TypeOf<typeof StartTimeMixinDataDef>;

export type IStartTime = StartTimeMixinData;

export function StartTimeMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements IStartTime {
        startTime = new Date();
    };
}
