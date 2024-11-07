import camelcaseKeys from 'camelcase-keys';
import decamelizeKeys from 'decamelize-keys';
import { chain } from 'fp-ts/lib/Either';
import * as t from 'io-ts';

export const AssignmentGroupDataDef = t.strict({
    id: t.string,
    name: t.string
});

export type AssignmentGroupData = t.TypeOf<typeof AssignmentGroupDataDef>;

export class AssignmentGroup implements AssignmentGroupData {
    public id = '';
    public name = '';
}

export const AssignmentGroupDef = new t.Type<AssignmentGroup, unknown, unknown>(
    'AssignmentGroup',
    (v): v is AssignmentGroup => v instanceof AssignmentGroup,
    (v, ctx) =>
        chain((v: AssignmentGroupData) => t.success(Object.assign(new AssignmentGroup(), v)))(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            AssignmentGroupDataDef.validate(camelcaseKeys(v as any, { deep: true }), ctx)
        ),
    (v) => decamelizeKeys(AssignmentGroupDataDef.encode(v))
);
