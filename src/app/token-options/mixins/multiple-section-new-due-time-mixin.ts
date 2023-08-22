import * as t from 'io-ts';
import { Constructor, DateDef } from 'app/utils/mixin-helper';
import { MultipleSectionDateMatcher, MultipleSectionDateMatcherDef } from 'app/utils/multiple-section-date-matcher';

export const MultipleSectionNewDueTimeMixinDataDef = t.strict({
    newDueTime: t.union([DateDef, MultipleSectionDateMatcherDef])
});

export type MultipleSectionNewDueTimeMixinData = t.TypeOf<typeof MultipleSectionNewDueTimeMixinDataDef>;
export type RawMultipleSectionNewDueTimeMixinData = t.OutputOf<typeof MultipleSectionNewDueTimeMixinDataDef>;

export type IMultipleSectionNewDueTime = MultipleSectionNewDueTimeMixinData;

export function MultipleSectionNewDueTimeMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements IMultipleSectionNewDueTime {
        newDueTime: Date | MultipleSectionDateMatcher = new Date();
    };
}
