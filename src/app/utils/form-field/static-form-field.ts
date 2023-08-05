import { BaseDirectFormField } from './direct-form-field';

export class StaticFormField<T> extends BaseDirectFormField<T, StaticFormField<T>> {
    public override async validate(): Promise<boolean> {
        return this._validator(this);
    }
}
