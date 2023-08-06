import * as t from 'io-ts';
import { chain } from 'fp-ts/Either';
import { fromUnixTime, getUnixTime } from 'date-fns';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = object> = new (...args: any[]) => T;
export type ExtractConstructedType<T> = T extends Constructor<infer O> ? O : never;

export const DateDef = new t.Type<Date, number, unknown>(
    'UnixTimeDate',
    (v): v is Date => v instanceof Date,
    (v, ctx) =>
        chain((time: number): t.Validation<Date> => {
            const res = fromUnixTime(time);
            return isNaN(res.getTime()) ? t.failure(v, ctx) : t.success(res);
        })(t.number.validate(v, ctx)),
    (v) => getUnixTime(v)
);
