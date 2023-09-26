import * as t from 'io-ts';
import { ISODateDef } from '../utils/mixin-helper';
import { chain } from 'fp-ts/Either';
import camelcaseKeys from 'camelcase-keys';
import decamelizeKeys from 'decamelize-keys';
import { NullOrUndefinedAsNull } from 'app/utils/io-ts-type-definitions';

export const AssignmentOverrideDataDef = t.intersection([
    t.strict({
        id: t.string,
        title: t.string,
        lockAt: t.union([ISODateDef, NullOrUndefinedAsNull]),
        unlockAt: t.union([ISODateDef, NullOrUndefinedAsNull]),
        dueAt: t.union([ISODateDef, NullOrUndefinedAsNull])
    }),
    t.union([
        t.strict({
            studentIds: t.array(t.string)
        }),
        t.strict({
            courseSectionId: t.string
        })
    ])
]);

export type AssignmentOverrideData = t.TypeOf<typeof AssignmentOverrideDataDef>;

export class AssignmentOverride {
    public id = '';
    public title = '';
    public lockAt: Date | null = null;
    public unlockAt: Date | null = null;
    public dueAt: Date | null = null;
    public studentIds?: string[];
    public courseSectionId?: string;

    public get isIndividualLevel(): boolean {
        return this.studentIds != undefined;
    }

    public get studentIdsAsIndividualLevel(): string[] {
        if (this.studentIds == undefined)
            throw new Error('Invalid operation: override is not an individual-level override');
        return this.studentIds;
    }

    public get isSectionLevel(): boolean {
        return this.courseSectionId != undefined;
    }

    public get sectionIdAsSectionLevel(): string {
        if (this.courseSectionId == undefined)
            throw new Error('Invalid operation: override is not a section-level override');
        return this.courseSectionId;
    }
}

export const AssignmentOverrideDef = new t.Type<AssignmentOverride, unknown, unknown>(
    'AssignmentOverride',
    (v): v is AssignmentOverride => v instanceof AssignmentOverride,
    (v, ctx) =>
        chain((v: AssignmentOverrideData) => t.success(Object.assign(new AssignmentOverride(), v)))(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            AssignmentOverrideDataDef.validate(camelcaseKeys(v as any, { deep: true }), ctx)
        ),
    (v) => {
        if (!AssignmentOverrideDataDef.is(v)) throw new Error('Invalid data');
        return decamelizeKeys(AssignmentOverrideDataDef.encode(v));
    }
);
