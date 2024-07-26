import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export const AssignmentGroupMixinDataDef = t.strict({
    groupName: t.string,
    groupId: t.string
});

export type AssignmentGroupMixinData = t.TypeOf<typeof AssignmentGroupMixinDataDef>;
export type RawAssignmentGroupMixinData = t.OutputOf<typeof AssignmentGroupMixinDataDef>;

export type IAssignmentGroup = AssignmentGroupMixinData & IGridViewDataSource;

export function AssignmentGroupMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IAssignmentGroup {
        groupName = '';
        groupId = '';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'Canvas Assignment Group Name',
                type: 'string',
                value: this.groupName
            }));
        }
    };
}
