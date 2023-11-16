import * as t from 'io-ts';
import { ISODateDef } from 'app/utils/mixin-helper';
import { NullOrUndefinedAsNull } from 'app/utils/io-ts-type-definitions';
import { chain } from 'fp-ts/Either';
import camelcaseKeys from 'camelcase-keys';
import decamelizeKeys from 'decamelize-keys';

export const AssignmentDateDataDef = t.intersection([
    t.union([t.strict({ id: t.string }), t.strict({ base: t.boolean })]),
    t.strict({
        dueAt: t.union([ISODateDef, NullOrUndefinedAsNull]),
        unlockAt: t.union([ISODateDef, NullOrUndefinedAsNull]),
        lockAt: t.union([ISODateDef, NullOrUndefinedAsNull])
    }),
    t.partial({ title: t.string, setType: t.string, setId: t.union([t.string, t.null]) })
]);

export type AssignmentDateData = t.TypeOf<typeof AssignmentDateDataDef>;

export class AssignmentDate {
    public id?: string;
    public base?: boolean;
    public title?: string;
    public dueAt: Date | null = null;
    public unlockAt: Date | null = null;
    public lockAt: Date | null = null;
    public setType?: string;
    public setId?: string;

    public get isDefaultLevel(): boolean {
        return this.base != undefined && this.base;
    }

    public get isSectionLevel(): boolean {
        this.checkCanvasImplementationChange();
        return (
            !this.isDefaultLevel &&
            this.id != undefined &&
            this.setType != undefined &&
            this.setType.toLowerCase().includes('section')
        );
    }

    public get isIndividualLevel(): boolean {
        this.checkCanvasImplementationChange();
        return !this.isDefaultLevel && this.id != undefined && !this.isSectionLevel;
    }

    private checkCanvasImplementationChange() {
        // 'set_type' is not a guaranteed property of Canvas Assignment Dates
        // but Token ATM needs it to differentiate between override levels.
        if (!this.isDefaultLevel && this.setType == undefined)
            throw new Error(
                'The type of this Assignment Date was not given by Canvas, notify the Token ATM developers that this has occurred.'
            );
    }
}

export const AssignmentDateDef = new t.Type<AssignmentDate, unknown, unknown>(
    'AssignmentDate',
    (v): v is AssignmentDate => v instanceof AssignmentDate,
    (v, ctx) =>
        chain((v: AssignmentDateData) => t.success(Object.assign(new AssignmentDate(), v)))(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            AssignmentDateDataDef.validate(camelcaseKeys(v as any, { deep: true }), ctx)
        ),
    (v) => {
        if (!AssignmentDateDataDef.is(v)) throw new Error('Invalid data');
        return decamelizeKeys(AssignmentDateDataDef.encode(v));
    }
);
