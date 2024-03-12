import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export const AdditionalCanvasScoreMixinDataDef = t.strict({
    additionalScore: t.string
});

export type AdditionalCanvasScoreMixinData = t.TypeOf<typeof AdditionalCanvasScoreMixinDataDef>;
export type RawAdditionalCanvasScoreMixinData = t.OutputOf<typeof AdditionalCanvasScoreMixinDataDef>;

export type IAdditionalCanvasScore = AdditionalCanvasScoreMixinData & IGridViewDataSource;

export function AdditionalCanvasScoreMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IAdditionalCanvasScore {
        additionalScore = '';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'Add to Canvas Assingment / Quiz Score',
                type: 'string', // TODO: Create a type for valid Canvas posted grade arguments
                value: this.additionalScore
            }));
        }
    };
}
