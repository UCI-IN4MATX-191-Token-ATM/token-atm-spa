import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

/**
 * @deprecated Backwards Compatible change for Spend For Passing Assignment Token Option
 * Should not be used by other Token Options
 *
 * @todo Consumes the `gradeThreshold` property and uses a TBD `replaceGrade` property
 */
export const ReplaceAndGradeThresholdMixinDataDef = t.strict({
    gradeThreshold: t.number
});

export type ReplaceAndGradeThresholdMixinData = t.TypeOf<typeof ReplaceAndGradeThresholdMixinDataDef>;
export type RawReplaceAndGradeThresholdMixinData = t.OutputOf<typeof ReplaceAndGradeThresholdMixinDataDef>;

export type IReplaceAndGradeThreshold = ReplaceAndGradeThresholdMixinData & IGridViewDataSource;

/**
 * @deprecated Backwards Compatible change for Spend For Passing Assignment Token Option
 * Should not be used by other Token Options
 *
 * @todo Consumes the `gradeThreshold` property and uses a TBD `replaceGrade` property
 */
export function ReplaceAndGradeThresholdMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IReplaceAndGradeThreshold {
        gradeThreshold = 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'New Percentage Grade',
                type: 'percentage',
                value: this.gradeThreshold
            }));
        }
    };
}
