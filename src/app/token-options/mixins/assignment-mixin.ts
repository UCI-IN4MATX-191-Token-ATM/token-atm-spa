import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';

export const AssignmentMixinDataDef = t.strict({
    assignmentName: t.string,
    assignmentId: t.string
});

export type AssignmentMixinData = t.TypeOf<typeof AssignmentMixinDataDef>;
export type RawAssignmentMixinData = t.OutputOf<typeof AssignmentMixinDataDef>;

export type IAssignment = AssignmentMixinData;

export function AssignmentMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements IAssignment {
        assignmentName = '';
        assignmentId = '';
    };
}
