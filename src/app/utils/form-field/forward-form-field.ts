import type { ExtractDest, ExtractSrc, ExtractVP, FormField } from './form-field';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ForwardFormField<F extends FormField<any, any, any>>
    implements FormField<ExtractSrc<F>, ExtractDest<F>, ExtractVP<F>>
{
    private hasCachedIsReadOnly = false;
    private cachedIsReadOnly = false;
    private hasCachedSrcValue = false;
    private cachedSrcValue?: ExtractSrc<F>;
    private hasCachedValidator = false;
    private cachedValidator?: (value: ExtractVP<F>) => Promise<boolean>;
    private hasCachedLabel = false;
    private cachedLabel?: string;
    private hasCachedErrorMessage = false;
    private cachedErrorMessage?: string;

    private _forwardedTo?: F;

    constructor(forwardedTo?: F) {
        if (forwardedTo) this.forwardedTo = forwardedTo;
    }

    public set forwardedTo(forwardedTo: F | undefined) {
        if (!forwardedTo) return;
        this._forwardedTo = forwardedTo;
        if (this.hasCachedIsReadOnly) this._forwardedTo.isReadOnly = this.cachedIsReadOnly;
        if (this.hasCachedSrcValue && this.cachedSrcValue !== undefined)
            this._forwardedTo.srcValue = this.cachedSrcValue;
        if (this.hasCachedValidator && this.cachedValidator !== undefined)
            this._forwardedTo.validator = this.cachedValidator;
        if (this.hasCachedLabel && this.cachedLabel !== undefined) this._forwardedTo.label = this.cachedLabel;
        if (this.hasCachedErrorMessage) this._forwardedTo.errorMessage = this.cachedErrorMessage;
        this.hasCachedIsReadOnly = false;
        this.hasCachedSrcValue = false;
        this.hasCachedValidator = false;
        this.hasCachedLabel = false;
        this.hasCachedErrorMessage = false;
    }

    public get forwardedTo(): F | undefined {
        return this._forwardedTo;
    }

    public set isReadOnly(isReadOnly: boolean) {
        if (!this._forwardedTo) {
            this.hasCachedIsReadOnly = true;
            this.cachedIsReadOnly = isReadOnly;
            return;
        }
        this._forwardedTo.isReadOnly = isReadOnly;
    }

    public get isReadOnly(): boolean {
        if (!this._forwardedTo) return this.hasCachedIsReadOnly ? this.cachedIsReadOnly : true;
        return this._forwardedTo.isReadOnly;
    }

    public set srcValue(srcValue: ExtractSrc<F>) {
        if (!this._forwardedTo) {
            this.hasCachedSrcValue = true;
            this.cachedSrcValue = srcValue;
            return;
        }
        this._forwardedTo.srcValue = srcValue;
    }

    public get destValue(): Promise<ExtractDest<F>> {
        if (!this._forwardedTo) throw new Error('Forwarded field is not ready yet!');
        return this._forwardedTo.destValue;
    }

    public async validate(): Promise<boolean> {
        if (!this._forwardedTo) return false;
        return await this._forwardedTo.validate();
    }

    public set validator(validator: (value: ExtractVP<F>) => Promise<boolean>) {
        if (!this._forwardedTo) {
            this.hasCachedValidator = true;
            this.cachedValidator = validator;
            return;
        }
        this._forwardedTo.validator = validator;
    }

    public get validator(): (value: ExtractVP<F>) => Promise<boolean> {
        if (!this._forwardedTo) {
            if (this.hasCachedValidator && this.cachedValidator !== undefined) return this.cachedValidator;
            throw new Error('Forwarded field is not ready yet!');
        }
        return this._forwardedTo.validator;
    }

    public set label(label: string) {
        if (!this._forwardedTo) {
            this.hasCachedLabel = true;
            this.cachedLabel = label;
            return;
        }
        this._forwardedTo.label = label;
    }

    public get label(): string {
        if (!this._forwardedTo) {
            if (this.hasCachedLabel && this.cachedLabel !== undefined) return this.cachedLabel;
            throw new Error('Forwarded field is not ready yet!');
        }
        return this._forwardedTo.label;
    }

    public set errorMessage(errorMessage: string | undefined) {
        if (!this._forwardedTo) {
            this.hasCachedErrorMessage = true;
            this.cachedErrorMessage = errorMessage;
            return;
        }
        this._forwardedTo.errorMessage = errorMessage;
    }

    public get errorMessage(): string | undefined {
        if (!this._forwardedTo) {
            if (this.hasCachedErrorMessage) return this.cachedErrorMessage;
            throw new Error('Forwarded field is not ready yet!');
        }
        return this._forwardedTo.errorMessage;
    }
}
