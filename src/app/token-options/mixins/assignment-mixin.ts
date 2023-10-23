import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export const AssignmentMixinDataDef = t.strict({
    assignmentName: t.string,
    assignmentId: t.string
});

export type AssignmentMixinData = t.TypeOf<typeof AssignmentMixinDataDef>;
export type RawAssignmentMixinData = t.OutputOf<typeof AssignmentMixinDataDef>;

export type IAssignment = AssignmentMixinData & IGridViewDataSource;

export function AssignmentMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IAssignment {
        assignmentName = '';
        assignmentId = '';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'Canvas Assignment Name',
                type: 'string',
                value: this.assignmentName
            }));
        }
    };
}
