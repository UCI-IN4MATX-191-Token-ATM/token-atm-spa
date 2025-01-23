import * as t from 'io-ts';
// import { chain } from 'fp-ts/Either';
import { type Constructor, DateDef } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';
import { MultipleSectionDateMatcher, MultipleSectionDateMatcherDef } from 'app/utils/multiple-section-date-matcher';

export const OptionalMultipleSectionStartTimeMixinDataDef = t.strict({
    startTime: t.union([DateDef, MultipleSectionDateMatcherDef, t.null])
});
// type MultipleSectionStartTimeMixinData = t.TypeOf<typeof MultipleSectionStartTimeMixinDataDef>;
// const PartialMultipleSectionStartTimeMixinDataDef = t.exact(t.partial(MultipleSectionStartTimeMixinDataDef.type.props));
// type PartialMultipleSectionStartTimeMixinData = t.TypeOf<typeof PartialMultipleSectionStartTimeMixinDataDef>;

// // TODO: Make Utility for constructing this kind of `io-ts` Type
// // (see also `optional-multiple-section-end-time-mixin.ts`)
// export const OptionalMultipleSectionStartTimeMixinDataDef = new t.Type<
//     MultipleSectionStartTimeMixinData,
//     PartialMultipleSectionStartTimeMixinData,
//     unknown
// >(
//     'OptionalMultipleSectionStartTimeMixinDataDef',
//     MultipleSectionStartTimeMixinDataDef.is,
//     (v, ctx) =>
//         chain((v: PartialMultipleSectionStartTimeMixinData): t.Validation<MultipleSectionStartTimeMixinData> => {
//             return v.startTime === undefined
//                 ? t.success({ startTime: null })
//                 : MultipleSectionStartTimeMixinDataDef.validate(v, ctx);
//         })(PartialMultipleSectionStartTimeMixinDataDef.validate(v, ctx)),
//     (v) => (v.startTime === null ? { startTime: undefined } : { startTime: v.startTime })
// );

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
