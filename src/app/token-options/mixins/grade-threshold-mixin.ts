import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export const GradeThresholdMixinDataDef = t.strict({
    gradeThreshold: t.number
});

export type GradeThresholdMixinData = t.TypeOf<typeof GradeThresholdMixinDataDef>;
export type RawGradeThresholdMixinData = t.OutputOf<typeof GradeThresholdMixinDataDef>;

export type IGradeThreshold = GradeThresholdMixinData & IGridViewDataSource;

export function GradeThresholdMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IGradeThreshold {
        gradeThreshold = 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'Grade Threshold',
                type: 'percentage',
                value: this.gradeThreshold
            }));
        }
    };
}
