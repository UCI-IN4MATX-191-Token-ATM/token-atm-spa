import * as t from 'io-ts';
import { chain } from 'fp-ts/Either';
import { type Constructor, DateDef } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';
import { MultipleSectionDateMatcher, MultipleSectionDateMatcherDef } from 'app/utils/multiple-section-date-matcher';

const MultipleSectionEndTimeMixinDataDef = t.strict({
    endTime: t.union([DateDef, MultipleSectionDateMatcherDef, t.null])
});

type MultipleSectionEndTimeMixinData = t.TypeOf<typeof MultipleSectionEndTimeMixinDataDef>;
const PartialMultipleSectionEndTimeMixinDataDef = t.exact(t.partial(MultipleSectionEndTimeMixinDataDef.type.props));
type PartialMultipleSectionEndTimeMixinData = t.TypeOf<typeof PartialMultipleSectionEndTimeMixinDataDef>;

// TODO: Make Utility for constructing this kind of `io-ts` Type
// (see also `optional-multiple-section-start-time-mixin.ts`)
export const OptionalMultipleSectionEndTimeMixinDataDef = new t.Type<
    MultipleSectionEndTimeMixinData,
    PartialMultipleSectionEndTimeMixinData,
    unknown
>(
    'OptionalMultipleSectionEndTimeMixinDataDef',
    MultipleSectionEndTimeMixinDataDef.is,
    (v, ctx) =>
        chain((v: PartialMultipleSectionEndTimeMixinData): t.Validation<MultipleSectionEndTimeMixinData> => {
            return v.endTime === undefined
                ? t.success({ endTime: null })
                : MultipleSectionEndTimeMixinDataDef.validate(v, ctx);
        })(PartialMultipleSectionEndTimeMixinDataDef.validate(v, ctx)),
    (v) => (v.endTime === null ? { endTime: undefined } : { endTime: v.endTime })
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
