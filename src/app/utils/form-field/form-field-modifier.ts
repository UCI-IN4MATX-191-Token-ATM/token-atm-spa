import type { ExtractDest, ExtractSrc, ExtractVP, FormField } from './form-field';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormFieldModifierConfig<F extends FormField<any, any, any>> = {
    setIsReadOnly?: (field: F, isReadOnly: boolean, superFunc: (isReadOnly: boolean) => void) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class FormFieldModifier<F extends FormField<any, any, any>>
    implements FormField<ExtractSrc<F>, ExtractDest<F>, ExtractVP<F>>
{
    constructor(private field: F, private config: FormFieldModifierConfig<F>) {}

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
        if (!this.config.setIsReadOnly) {
            this.field.isReadOnly = isReadOnly;
            return;
        }
        this.config.setIsReadOnly(this.field, isReadOnly, (isReadOnly: boolean) => {
            this.field.isReadOnly = isReadOnly;
        });
    }

    public get isReadOnly() {
        return this.field.isReadOnly;
    }

    public set srcValue(srcValue: ExtractSrc<F>) {
        this.field.srcValue = srcValue;
    }

    public get destValue(): Promise<ExtractDest<F>> {
        return this.field.destValue;
    }

    public set validator(validator: (value: ExtractVP<F>) => Promise<boolean>) {
        this.field.validator = validator;
    }

    public validate(): Promise<boolean> {
        return this.field.validate();
    }
}
