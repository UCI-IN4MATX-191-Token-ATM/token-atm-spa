import { fromUnixTime, getUnixTime } from 'date-fns';
import * as t from 'io-ts';
import { isLeft, chain } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';

const DateTypeDef = new t.Type<Date, number, unknown>(
    'Date',
    (v): v is Date => v instanceof Date,
    (v, ctx) =>
        chain((time: number): t.Validation<Date> => {
            const res = fromUnixTime(time);
            return isNaN(res.getTime()) ? t.failure(v, ctx) : t.success(res);
        })(t.number.validate(v, ctx)),
    (v) => getUnixTime(v)
);

export const DateOverrideDef = t.type({
    sections: t.array(t.tuple([t.string, t.string])),
    name: t.string,
    date: DateTypeDef
});

export type DateOverride = t.TypeOf<typeof DateOverrideDef>;

export class MultipleSectionDateMatcher {
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
                const res = DateOverrideDef.decode(overrideData);
                if (isLeft(res)) throw new Error('Invalid data: ' + PathReporter.report(res).join('\n'));
                overrides.push(res.right);
            }
        }
        return new MultipleSectionDateMatcher(defaultDate, overrides);
    }
}
