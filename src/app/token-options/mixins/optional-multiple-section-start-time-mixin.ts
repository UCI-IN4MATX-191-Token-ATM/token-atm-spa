import * as t from 'io-ts';
import { type Constructor, DateDef } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';
import { MultipleSectionDateMatcher, MultipleSectionDateMatcherDef } from 'app/utils/multiple-section-date-matcher';

const MultipleSectionStartTimeMixinDataDef = t.strict({
    startTime: t.union([DateDef, MultipleSectionDateMatcherDef, t.null])
});
type MultipleSectionStartTimeMixinData = t.TypeOf<typeof MultipleSectionStartTimeMixinDataDef>;
const PartialMultipleSectionStartTimeMixinDataDef = t.exact(t.partial(MultipleSectionStartTimeMixinDataDef.type.props));
type RawPartialMultipleSectionStartTimeMixinData = t.OutputOf<typeof PartialMultipleSectionStartTimeMixinDataDef>;

// TODO: Make Utility for constructing this kind of `io-ts` Type
// (see also `optional-multiple-section-end-time-mixin.ts`)
export const OptionalMultipleSectionStartTimeMixinDataDef = new t.Type<
    MultipleSectionStartTimeMixinData,
    RawPartialMultipleSectionStartTimeMixinData,
    unknown
>(
    'OptionalMultipleSectionStartTimeMixinDataDef',
    MultipleSectionStartTimeMixinDataDef.is,
    (v, ctx) => {
        if (PartialMultipleSectionStartTimeMixinDataDef.is(v) && v.startTime === undefined) {
            return t.success({ startTime: null });
        } else {
            return MultipleSectionStartTimeMixinDataDef.validate(v, ctx);
        }
    },
    (v) => (v.startTime === null ? { startTime: undefined } : MultipleSectionStartTimeMixinDataDef.encode(v))
);

export type OptionalMultipleSectionStartTimeMixinData = t.TypeOf<typeof OptionalMultipleSectionStartTimeMixinDataDef>;
export type RawOptionalMultipleSectionStartTimeMixinData = t.OutputOf<
    typeof OptionalMultipleSectionStartTimeMixinDataDef
>;

export type IOptionalMultipleSectionStartTime = OptionalMultipleSectionStartTimeMixinData & IGridViewDataSource;

export function OptionalMultipleSectionStartTimeMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IOptionalMultipleSectionStartTime {
        startTime: Date | MultipleSectionDateMatcher | null = null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() =>
                this.startTime !== null
                    ? this.startTime instanceof MultipleSectionDateMatcher
                        ? {
                              colName: 'Can Request From (with exceptions)',
                              type: 'html',
                              value: this.startTime.toHTML()
                          }
                        : {
                              colName: 'Can Request From',
                              type: 'date',
                              value: this.startTime
                          }
                    : undefined
            );
        }
    };
}
