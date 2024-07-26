import type { Observable } from 'rxjs';
import type { ExtractSrc, ExtractVP, FormField, ObservableFormField } from './form-field';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class FormFieldObservableSrcTransformer<D, F extends FormField<any, D, any> & ObservableFormField<D>, S1>
    implements FormField<S1, D, ExtractVP<F>>, ObservableFormField<D>
{
    constructor(private field: F, private srcTransformer: (value: S1) => ExtractSrc<F>) {}

    public set label(label: string) {
        this.field.label = label;
    }

    public get label(): string {
        return this.field.label;
    }

    public set errorMessage(errorMessage: string | undefined) {
        this.field.errorMessage = errorMessage;
    }

    public get errorMessage(): string | undefined {
        return this.field.errorMessage;
    }

    public set isReadOnly(isReadOnly: boolean) {
        this.field.isReadOnly = isReadOnly;
    }

    public get isReadOnly() {
        return this.field.isReadOnly;
    }

    public set srcValue(srcValue: S1) {
        this.field.srcValue = this.srcTransformer(srcValue);
    }

    public get destValue(): Promise<D> {
        return this.field.destValue;
    }

    public get destValue$(): Observable<D> {
        return this.field.destValue$;
    }

    public set validator(validator: (value: ExtractVP<F>) => Promise<boolean>) {
        this.field.validator = validator;
    }

    public validate(): Promise<boolean> {
        return this.field.validate();
    }
}
