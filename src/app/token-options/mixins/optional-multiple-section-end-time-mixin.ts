import * as t from 'io-ts';
import { type Constructor, DateDef } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';
import { MultipleSectionDateMatcher, MultipleSectionDateMatcherDef } from 'app/utils/multiple-section-date-matcher';

const MultipleSectionEndTimeMixinDataDef = t.strict({
    endTime: t.union([DateDef, MultipleSectionDateMatcherDef, t.null])
});

type MultipleSectionEndTimeMixinData = t.TypeOf<typeof MultipleSectionEndTimeMixinDataDef>;
const PartialMultipleSectionEndTimeMixinDataDef = t.exact(t.partial(MultipleSectionEndTimeMixinDataDef.type.props));
type RawPartialMultipleSectionEndTimeMixinData = t.OutputOf<typeof PartialMultipleSectionEndTimeMixinDataDef>;

// TODO: Make Utility for constructing this kind of `io-ts` Type
// (see also `optional-multiple-section-start-time-mixin.ts`)
export const OptionalMultipleSectionEndTimeMixinDataDef = new t.Type<
    MultipleSectionEndTimeMixinData,
    RawPartialMultipleSectionEndTimeMixinData,
    unknown
>(
    'OptionalMultipleSectionEndTimeMixinDataDef',
    MultipleSectionEndTimeMixinDataDef.is,
    (v, ctx) => {
        if (PartialMultipleSectionEndTimeMixinDataDef.is(v) && v.endTime === undefined) {
            return t.success({ endTime: null });
        } else {
            return MultipleSectionEndTimeMixinDataDef.validate(v, ctx);
        }
    },
    (v) => (v.endTime === null ? { endTime: undefined } : MultipleSectionEndTimeMixinDataDef.encode(v))
);

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
