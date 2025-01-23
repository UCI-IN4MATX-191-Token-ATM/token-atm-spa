import { format, fromUnixTime, getUnixTime } from 'date-fns';
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
export type RawMultipleSectionDateMatcherData = t.OutputOf<typeof MultipleSectionDateMatcherDataDef>;

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

    public toHTML(): string {
        if (this._overrides.length == 0) {
            return format(this.defaultDate, 'MMM dd, yyyy HH:mm:ss');
        }
        return [
            '<table style="border-collapse: collapse; width: 100%;">',
            '<tbody>',
            ...this.overrides.map((override) => {
                return [
                    `<tr>`,
                    `<td style="text-align: end; text-wrap: nowrap">${override.name}:</td>`,
                    `<td style="text-align: start; text-wrap: nowrap">${format(
                        override.date,
                        'MMM dd, yyyy HH:mm:ss'
                    )}</td>`,
                    `</tr>`
                ].join('');
            }),
            '<tr>',
            '<td style="text-align: end; text-wrap: nowrap">Default:</td>',
            `<td style="text-align: start; text-wrap: nowrap">${format(
                this.defaultDate,
                'MMM dd, yyyy HH:mm:ss'
            )}</td>`,
            '</tr>',
            '</tbody>',
            '</table>'
        ].join('');
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

/**
 * Generates valid Raw Multiple Section Date Matcher Data values
 *
 * Note: passing (`undefined`, `false`) will result in early termination.
 * No values will be returned for this case.
 *
 * @param o valid Multiple Section Date Matcher Data or undefined
 * @param genExtra flag for generating valid but not equal raw data
 */
function* genMultipleSectionValues(
    o?: MultipleSectionDateMatcherData,
    genExtra = false
): Generator<RawMultipleSectionDateMatcherData, void, unknown> {
    if (o === undefined && !genExtra) {
        return;
    }
    o = o
        ? o
        : {
              defaultDate: new Date(),
              overrides: undefined
          };
    yield {
        defaultDate: getUnixTime(o.defaultDate),
        overrides: o.overrides
            ? o.overrides.map((x) => {
                  return { ...x, date: getUnixTime(x.date) };
              })
            : undefined
    };
    if (genExtra) {
        yield {
            defaultDate: getUnixTime(o.defaultDate),
            overrides: o.overrides
                ? undefined
                : [{ sections: [['', ''] as [string, string]], name: '', date: getUnixTime(o.defaultDate) }]
        };
    }
}

/**
 * Generate Raw values for MultipleSectionTimeOverrides Data
 * @param v valid value
 * @param genExtra flag for generating valid but not equal Raw values
 */
export function* genRawMultipleSectionTimeValues(
    v: Date | MultipleSectionDateMatcherData | null,
    genExtra = false
): Generator<number | RawMultipleSectionDateMatcherData | null, void, unknown> {
    if (v === null) {
        yield null;
        if (genExtra) {
            yield getUnixTime(new Date());
            yield* genMultipleSectionValues(undefined, genExtra);
        }
    } else if (v && Object.prototype.toString.call(v) === '[object Date]') {
        yield getUnixTime(v as Date);
        if (genExtra) {
            yield null;
            yield* genMultipleSectionValues(undefined, genExtra);
        }
    } else if ((v as MultipleSectionDateMatcherData)?.defaultDate !== undefined) {
        yield* genMultipleSectionValues(v as MultipleSectionDateMatcherData, genExtra);
        if (genExtra) {
            yield null;
            yield getUnixTime(new Date());
        }
    }
}
