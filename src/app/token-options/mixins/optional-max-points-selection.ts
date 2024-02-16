import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';
import { AssignmentGroupMixinData, AssignmentGroupMixinDataDef } from './assignment-group-mixin';

// TODO: Expand to include other selection options (also update registered data points)
const Selectable = t.tuple([t.string, AssignmentGroupMixinDataDef]);

export const OptionalMaxPointsSelectionMixinDataDef = t.strict({
    changeMaxPossiblePoints: t.union([Selectable, t.undefined])
});

export type OptionalMaxPointsSelectionMixinData = t.TypeOf<typeof OptionalMaxPointsSelectionMixinDataDef>;
export type RawOptionalMaxPointsSelectionMixinData = t.OutputOf<typeof OptionalMaxPointsSelectionMixinDataDef>;

export type IOptionalMaxPointsSelection = OptionalMaxPointsSelectionMixinData & IGridViewDataSource;

export function OptionalMaxPointsSelectionMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IOptionalMaxPointsSelection {
        changeMaxPossiblePoints: [string, AssignmentGroupMixinData] | undefined = undefined;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() =>
                this.changeMaxPossiblePoints != null
                    ? {
                          colName: 'Base Max Possible Points on',
                          type: 'string',
                          value: 'Canvas Assignment Group'
                      }
                    : undefined
            );
        }
    };
}
