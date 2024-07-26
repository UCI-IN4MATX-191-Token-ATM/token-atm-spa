import type { FormField } from './form-field';
import { ForwardFormField } from './forward-form-field';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FormFieldWrapper<F extends FormField<any, any, any>, S, D, VP> extends FormField<S, D, VP> {
    set wrappedField(wrappedField: F);
}

export class FormFieldWrapperApplier<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    F1 extends FormField<any, any, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    F2 extends FormFieldWrapper<F1, any, any, any>
> extends ForwardFormField<F2> {
    constructor(public fieldA: F1, public fieldB: F2) {
        super(fieldB);
        fieldB.wrappedField = fieldA;
    }
}
