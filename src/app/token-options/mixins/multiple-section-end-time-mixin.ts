import * as t from 'io-ts';
import { Constructor, DateDef } from 'app/utils/mixin-helper';
import { MultipleSectionDateMatcher, MultipleSectionDateMatcherDef } from 'app/utils/multiple-section-date-matcher';

export const MultipleSectionEndTimeMixinDataDef = t.strict({
    endTime: t.union([DateDef, MultipleSectionDateMatcherDef])
});

export type MultipleSectionEndTimeMixinData = t.TypeOf<typeof MultipleSectionEndTimeMixinDataDef>;

export type IMultipleSectionEndTime = MultipleSectionEndTimeMixinData;

export function MultipleSectionEndTimeMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements IMultipleSectionEndTime {
        endTime: Date | MultipleSectionDateMatcher = new Date();
    };
}
