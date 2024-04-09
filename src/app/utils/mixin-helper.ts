import * as t from 'io-ts';
import { chain } from 'fp-ts/Either';
import { formatISO, fromUnixTime, getUnixTime, parseISO } from 'date-fns';
import { Base64 } from 'js-base64';
import { ErrorSerializer } from './error-serailizer';

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

export const ISODateDef = new t.Type<Date, string, unknown>(
    'ISODate',
    (v): v is Date => v instanceof Date,
    (v, ctx) =>
        chain((time: string): t.Validation<Date> => {
            const res = parseISO(time);
            return isNaN(res.getTime()) ? t.failure(v, ctx) : t.success(res);
        })(t.string.validate(v, ctx)),
    (v) => formatISO(v)
);

export const Base64StringDef = new t.Type<string, string | undefined, unknown>(
    'Base64String',
    (v): v is string => typeof v == 'string',
    (v, ctx) => {
        if (v == undefined) return t.success('');
        return chain((v: string): t.Validation<string> => {
            try {
                const result = Base64.decode(v);
                return t.success(result);
            } catch (err: unknown) {
                return t.failure(v, ctx, ErrorSerializer.serailize(err));
            }
        })(t.string.validate(v, ctx));
    },
    (v) => Base64.encode(v)
);
