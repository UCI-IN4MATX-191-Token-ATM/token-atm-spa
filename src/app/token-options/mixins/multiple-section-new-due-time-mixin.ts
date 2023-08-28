import * as t from 'io-ts';
import { Constructor, DateDef } from 'app/utils/mixin-helper';
import { MultipleSectionDateMatcher, MultipleSectionDateMatcherDef } from 'app/utils/multiple-section-date-matcher';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export const MultipleSectionNewDueTimeMixinDataDef = t.strict({
    newDueTime: t.union([DateDef, MultipleSectionDateMatcherDef])
});

export type MultipleSectionNewDueTimeMixinData = t.TypeOf<typeof MultipleSectionNewDueTimeMixinDataDef>;
export type RawMultipleSectionNewDueTimeMixinData = t.OutputOf<typeof MultipleSectionNewDueTimeMixinDataDef>;

export type IMultipleSectionNewDueTime = MultipleSectionNewDueTimeMixinData & IGridViewDataSource;

export function MultipleSectionNewDueTimeMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IMultipleSectionNewDueTime {
        newDueTime: Date | MultipleSectionDateMatcher = new Date();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() =>
                this.newDueTime instanceof MultipleSectionDateMatcher
                    ? {
                          colName: 'Change Until Date/Time for Canvas Assignment/Quiz to (with exceptions)',
                          type: 'html',
                          value: this.newDueTime.toHTML()
                      }
                    : {
                          colName: 'Change Until Date/Time for Canvas Assignment/Quiz to',
                          type: 'date',
                          value: this.newDueTime
                      }
            );
        }
    };
}
