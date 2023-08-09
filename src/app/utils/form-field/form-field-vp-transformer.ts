import type { ExtractDest, ExtractSrc, ExtractVP, FormField } from './form-field';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class FormFieldVPTransformer<F extends FormField<any, any, any>, VP1>
    implements FormField<ExtractSrc<F>, ExtractDest<F>, VP1>
{
    constructor(private field: F, private VPTransformer: (value: ExtractVP<F>) => Promise<VP1>) {}

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

    public get destValue(): Promise<ExtractDest<F>> {
        return this.field.destValue;
    }

    public set validator(validator: (value: VP1) => Promise<boolean>) {
        this.field.validator = async (value: ExtractVP<F>) => {
            return validator(await this.VPTransformer(value));
        };
    }

    public validate(): Promise<boolean> {
        return this.field.validate();
    }
}
