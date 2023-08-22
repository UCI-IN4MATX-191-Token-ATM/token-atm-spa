import type { Constructor, ExtractConstructedType } from 'app/utils/mixin-helper';

export interface IToJSON {
    toJSON(): unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ToJSONMixin<TBase extends Constructor<any>>(
    Base: TBase,
    encoder: (v: ExtractConstructedType<TBase>) => unknown
) {
    return class extends Base implements IToJSON {
        public toJSON(): unknown {
            return encoder(this as ExtractConstructedType<TBase>);
        }
    };
}
