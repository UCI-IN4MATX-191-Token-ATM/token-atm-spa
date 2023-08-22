import type { ExtractDest, ExtractSrc, FormField } from './form-field';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class FormFieldVPAppender<F extends FormField<any, any, any>, VP1>
    implements FormField<ExtractSrc<F>, ExtractDest<F>, VP1>
{
    private _validator?: (value: VP1) => Promise<boolean>;

    constructor(private field: F, private VPTransformer: (value: F) => Promise<VP1>) {}

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
        this._validator = validator;
    }

    public async validate(): Promise<boolean> {
        const result = await this.field.validate();
        if (this._validator != undefined) {
            const appendedResult = await this._validator(await this.VPTransformer(this.field));
            return result && appendedResult;
        }
        return result;
    }
}
