import * as t from 'io-ts';
import { chain } from 'fp-ts/Either';

export type AttributeWrapper<K extends string, V> = {
    [P in K]: V;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getterWrapper<K extends string, V extends t.Type<any, any, any>>(
    key: K,
    valueType: V
): t.Type<AttributeWrapper<K, t.TypeOf<V>>, AttributeWrapper<K, t.OutputOf<V>>, unknown> {
    return new t.Type<AttributeWrapper<K, t.TypeOf<V>>, AttributeWrapper<K, t.OutputOf<V>>, unknown>(
        'GetterWrapper' + valueType.name,
        (v): v is AttributeWrapper<K, t.TypeOf<V>> => valueType.is((v as AttributeWrapper<K, t.TypeOf<V>>)[key]),
        (v, ctx) =>
            chain((value: t.TypeOf<V>) => {
                return t.success({
                    [key]: value
                } as AttributeWrapper<K, t.TypeOf<V>>);
            })(valueType.validate((v as AttributeWrapper<K, t.TypeOf<V>>)[key], ctx)),
        (v) => {
            return {
                [key]: valueType.encode(v[key])
            } as AttributeWrapper<K, t.OutputOf<V>>;
        }
    );
}
