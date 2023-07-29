import type { ExtractDest, ExtractSrc, ExtractVP, FormField } from './form-field';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class FormFieldDestTransformer<F extends FormField<any, any, any>, D1>
    implements FormField<ExtractSrc<F>, D1, ExtractVP<F>>
{
    constructor(private field: F, private destTransformer: (value: ExtractDest<F>) => Promise<D1>) {}

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

    public set srcValue(srcValue: ExtractSrc<F>) {
        this.field.srcValue = srcValue;
    }

    public get destValue(): Promise<D1> {
        return (async () => {
            return this.destTransformer(await this.field.destValue);
        })();
    }

    public set validator(validator: (value: ExtractVP<F>) => Promise<boolean>) {
        this.field.validator = validator;
    }

    public validate(): Promise<boolean> {
        return this.field.validate();
    }
}
