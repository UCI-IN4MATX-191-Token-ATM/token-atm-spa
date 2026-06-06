import camelcaseKeys from 'camelcase-keys';
import decamelizeKeys from 'decamelize-keys';
import { chain } from 'fp-ts/lib/Either';
import * as t from 'io-ts';

const propsAndTypes = {
    years: t.number,
    months: t.number,
    weeks: t.number,
    days: t.number,
    hours: t.number,
    minutes: t.number,
    seconds: t.number
};

export type DurationPropertiesUnion = keyof typeof propsAndTypes;
export const DurationProperties = Object.keys(propsAndTypes) as DurationPropertiesUnion[];

export const DurationDataDef = t.exact(t.partial(propsAndTypes));

export type DurationData = t.TypeOf<typeof DurationDataDef>;

export class Duration implements DurationData {}

export const DurationDef = new t.Type<Duration, unknown, unknown>(
    'Duration',
    (v): v is Duration => v instanceof Duration,
    (v, ctx) =>
        chain((v: DurationData) => t.success(Object.assign(new Duration(), v)))(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            DurationDataDef.validate(camelcaseKeys(v as any, { deep: true }), ctx)
        ),
    (v) => decamelizeKeys(DurationDataDef.encode(v))
);
