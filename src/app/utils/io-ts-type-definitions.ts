import * as t from 'io-ts';

export const NullOrUndefinedAsNull = new t.Type<null, unknown, unknown>(
    'NullOrUndefinedAsNull',
    (v): v is null => v == null,
    (v, ctx) => (v === null || v === undefined ? t.success(null) : t.failure(v, ctx)),
    () => null
);
