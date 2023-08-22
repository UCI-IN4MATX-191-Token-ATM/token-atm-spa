import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';

export const GradeThresholdMixinDataDef = t.strict({
    gradeThreshold: t.number
});

export type GradeThresholdMixinData = t.TypeOf<typeof GradeThresholdMixinDataDef>;
export type RawGradeThresholdMixinData = t.OutputOf<typeof GradeThresholdMixinDataDef>;

export type IGradeThreshold = GradeThresholdMixinData;

export function GradeThresholdMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements IGradeThreshold {
        gradeThreshold = 1;
    };
}
