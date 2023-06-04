import type { TokenOptionGroup } from 'app/data/token-option-group';
import type { TokenOption } from 'app/token-options/token-option';
import type { FormField } from 'app/utils/form-field';

export abstract class TokenOptionField<T extends TokenOption = TokenOption>
    implements FormField<TokenOptionGroup | T, T>
{
    _isReadOnly = false;
    protected _subFields: FormField<unknown, unknown>[] = [];

    public set isReadOnly(isReadOnly: boolean) {
        this._isReadOnly = isReadOnly;
    }

    public get isReadOnly(): boolean {
        return this._isReadOnly;
    }

    public abstract set initValue(initValue: TokenOptionGroup | T);

    public set validator(_: <V extends T>(value: V) => Promise<string | undefined>) {
        // Ignore validator
    }

    public abstract getValue(): Promise<T>;

    public async validate(): Promise<boolean> {
        let result = true;
        for (const field of this._subFields) {
            const tmpResult = await field.validate();
            result &&= tmpResult;
        }
        return result;
    }

    protected addSubField<K, V>(field: FormField<K, V>) {
        this._subFields.push(field);
    }
}
