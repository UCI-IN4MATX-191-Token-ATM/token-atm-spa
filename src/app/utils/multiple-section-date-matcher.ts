import { fromUnixTime, getUnixTime } from 'date-fns';
import * as t from 'io-ts';
import { chain } from 'fp-ts/Either';
import { DateDef } from './mixin-helper';
import { unwrapValidation } from './validation-unwrapper';

export const DateOverrideDef = t.strict({
    sections: t.array(t.tuple([t.string, t.string])),
    name: t.string,
    date: DateDef
});

export const MultipleSectionDateMatcherDataDef = t.strict({
    defaultDate: DateDef,
    overrides: t.union([t.array(DateOverrideDef), t.undefined])
});

export type MultipleSectionDateMatcherData = t.TypeOf<typeof MultipleSectionDateMatcherDataDef>;

export type DateOverride = t.TypeOf<typeof DateOverrideDef>;

export class MultipleSectionDateMatcher implements MultipleSectionDateMatcherData {
    constructor(private _defaultDate: Date, private _overrides: DateOverride[] = []) {}

    public get defaultDate(): Date {
        return this._defaultDate;
    }

    public get overrides(): DateOverride[] {
        return this._overrides;
    }

    public match(sectionIds: string[]): Date {
        for (const override of this.overrides) {
            const matchedSectionIds = new Set(override.sections.map((value) => value[1]));
            for (const sectionId of sectionIds) {
                if (matchedSectionIds.has(sectionId)) {
                    return override.date;
                }
            }
        }
        return this.defaultDate;
    }

    public toJSON(): object {
        return {
            default_date: getUnixTime(this.defaultDate),
            overrides: this.overrides.map(DateOverrideDef.encode)
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(data: any): MultipleSectionDateMatcher {
        if (
            typeof data['default_date'] != 'number' ||
            (typeof data['overrides'] != 'undefined' && typeof data['overrides'] != 'object')
        )
            throw new Error('Invalid data');
        const defaultDate = fromUnixTime(data['default_date']);
        const overrides: DateOverride[] = [];
        if (typeof data['overrides'] != 'undefined') {
            if (!Array.isArray(data['overrides'])) throw new Error('Invalid data');
            for (const overrideData of data['overrides']) {
                const res = unwrapValidation(DateOverrideDef.decode(overrideData));
                overrides.push(res);
            }
        }
        return new MultipleSectionDateMatcher(defaultDate, overrides);
    }
}

export const MultipleSectionDateMatcherDef = new t.Type<
    MultipleSectionDateMatcher,
    t.OutputOf<typeof MultipleSectionDateMatcherDataDef>,
    unknown
>(
    'MultipleSectionDateMatcher',
    (v): v is MultipleSectionDateMatcher => v instanceof MultipleSectionDateMatcher,
    (v, ctx) =>
        chain((v: MultipleSectionDateMatcherData): t.Validation<MultipleSectionDateMatcher> => {
            return t.success(new MultipleSectionDateMatcher(v.defaultDate, v.overrides));
        })(MultipleSectionDateMatcherDataDef.validate(v, ctx)),
    (v) =>
        MultipleSectionDateMatcherDataDef.encode({
            defaultDate: v.defaultDate,
            overrides: v.overrides
        })
);
