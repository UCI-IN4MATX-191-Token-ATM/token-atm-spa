import { BaseFormField, type FormField } from './form-field';

export type DirectFormField<V, VP> = FormField<V, V, VP>;

export abstract class BaseDirectFormField<V, VP> extends BaseFormField<V, V, VP> implements DirectFormField<V, VP> {
    protected value?: V;

    set srcValue(srcValue: V) {
        this.value = srcValue;
    }
    get destValue(): Promise<V> {
        return Promise.resolve(this.value as V);
    }
}
