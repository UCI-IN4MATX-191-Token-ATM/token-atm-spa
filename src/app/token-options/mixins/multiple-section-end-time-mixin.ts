import * as t from 'io-ts';
import { Constructor, DateDef } from 'app/utils/mixin-helper';
import { MultipleSectionDateMatcher, MultipleSectionDateMatcherDef } from 'app/utils/multiple-section-date-matcher';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export const MultipleSectionEndTimeMixinDataDef = t.strict({
    endTime: t.union([DateDef, MultipleSectionDateMatcherDef])
});

export type MultipleSectionEndTimeMixinData = t.TypeOf<typeof MultipleSectionEndTimeMixinDataDef>;
export type RawMultipleSectionEndTimeMixinData = t.OutputOf<typeof MultipleSectionEndTimeMixinDataDef>;

export type IMultipleSectionEndTime = MultipleSectionEndTimeMixinData & IGridViewDataSource;

export function MultipleSectionEndTimeMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IMultipleSectionEndTime {
        endTime: Date | MultipleSectionDateMatcher = new Date();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() =>
                this.endTime instanceof MultipleSectionDateMatcher
                    ? {
                          colName: 'End At (with exceptions)',
                          type: 'html',
                          value: this.endTime.toHTML()
                      }
                    : {
                          colName: 'End At',
                          type: 'date',
                          value: this.endTime
                      }
            );
        }
    };
}
