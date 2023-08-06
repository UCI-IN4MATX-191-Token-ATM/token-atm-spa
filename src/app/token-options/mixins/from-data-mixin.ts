import type { Constructor, ExtractConstructedType } from 'app/utils/mixin-helper';

export interface IFromData<T> {
    fromRawData(rawData: unknown): this;
    fromData(data: T, isValidated?: boolean): this;
    validateData(data: unknown): data is T;
}

export type ExtractFromDataType<T> = T extends IFromData<infer O> ? O : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FromDataMixin<T, TBase extends Constructor<any>>(
    Base: TBase,
    decoder: (v: unknown) => T,
    validator: (v: unknown) => v is T,
    initializer?: (data: ExtractConstructedType<TBase> & IFromData<T>) => void
) {
    return class extends Base implements IFromData<T> {
        public fromRawData(rawData: unknown): this {
            return this._initFromData(decoder(rawData));
        }

        public fromData(data: T, isValidated?: boolean | undefined): this {
            if (!isValidated && !validator(data)) throw new Error('Invalid data');
            return this._initFromData(data);
        }

        public validateData(data: unknown): data is T {
            return validator(data);
        }

        private _initFromData(data: T): this {
            Object.assign(this, data);
            if (initializer != undefined) initializer(this as ExtractConstructedType<TBase> & IFromData<T>);
            return this;
        }
    };
}
