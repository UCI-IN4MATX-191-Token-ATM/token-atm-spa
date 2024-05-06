import camelcaseKeys from 'camelcase-keys';
import decamelizeKeys from 'decamelize-keys';
import { chain } from 'fp-ts/lib/Either';
import * as t from 'io-ts';

export const CanvasIdentifierDataDef = t.strict({
    id: t.string,
    name: t.string
});

export type CanvasIdentifierData = t.TypeOf<typeof CanvasIdentifierDataDef>;

export class CanvasIdentifier implements CanvasIdentifierData {
    public id = '';
    public name = '';
}

export const CanvasIdentifierDef = new t.Type<CanvasIdentifier, unknown, unknown>(
    'CanvasIdentifier',
    (v): v is CanvasIdentifier => v instanceof CanvasIdentifier,
    (v, ctx) =>
        chain((v: CanvasIdentifierData) => t.success(Object.assign(new CanvasIdentifier(), v)))(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            CanvasIdentifierDataDef.validate(camelcaseKeys(v as any, { deep: true }), ctx)
        ),
    (v) => decamelizeKeys(CanvasIdentifierDataDef.encode(v))
);
