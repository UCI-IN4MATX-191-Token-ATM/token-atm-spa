import * as t from 'io-ts';
import { type Constructor, DateDef } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';
import { MultipleSectionDateMatcher, MultipleSectionDateMatcherDef } from 'app/utils/multiple-section-date-matcher';

export const OptionalMultipleSectionEndTimeMixinDataDef = t.strict({
    endTime: t.union([DateDef, MultipleSectionDateMatcherDef, t.null])
});

export type OptionalMultipleSectionEndTimeMixinData = t.TypeOf<typeof OptionalMultipleSectionEndTimeMixinDataDef>;
export type RawOptionalMultipleSectionEndTimeMixinData = t.OutputOf<typeof OptionalMultipleSectionEndTimeMixinDataDef>;

export type IOptionalMultipleSectionEndTime = OptionalMultipleSectionEndTimeMixinData & IGridViewDataSource;

export function OptionalMultipleSectionEndTimeMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IOptionalMultipleSectionEndTime {
        endTime: Date | MultipleSectionDateMatcher | null = null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() =>
                this.endTime !== null
                    ? this.endTime instanceof MultipleSectionDateMatcher
                        ? {
                              colName: 'Can Request Until (with exceptions)',
                              type: 'html',
                              value: this.endTime.toHTML()
                          }
                        : {
                              colName: 'Can Request Until',
                              type: 'date',
                              value: this.endTime
                          }
                    : undefined
            );
        }
    };
}
