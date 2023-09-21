import { ISODateDef } from 'app/utils/mixin-helper';
import camelcaseKeys from 'camelcase-keys';
import decamelizeKeys from 'decamelize-keys';
import { chain } from 'fp-ts/lib/Either';
import * as t from 'io-ts';

export const AssignmentDataDef = t.strict({
    id: t.string,
    name: t.string,
    dueAt: t.union([ISODateDef, t.null]),
    unlockAt: t.union([ISODateDef, t.null]),
    lockAt: t.union([ISODateDef, t.null])
});

export type AssignmentData = t.TypeOf<typeof AssignmentDataDef>;

export class Assignment implements AssignmentData {
    public id = '';
    public name = '';
    public dueAt: Date | null = null;
    public unlockAt: Date | null = null;
    public lockAt: Date | null = null;
}

export const AssignmentDef = new t.Type<Assignment, unknown, unknown>(
    'Assignment',
    (v): v is Assignment => v instanceof Assignment,
    (v, ctx) =>
        chain((v: AssignmentData) => t.success(Object.assign(new Assignment(), v)))(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            AssignmentDataDef.validate(camelcaseKeys(v as any, { deep: true }), ctx)
        ),
    (v) => decamelizeKeys(AssignmentDataDef.encode(v))
);
