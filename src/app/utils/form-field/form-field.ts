import type { Observable } from 'rxjs';

export interface FormField<S, D, VP> {
    set srcValue(srcValue: S);
    get destValue(): Promise<D>;
    validator: (value: VP) => Promise<boolean>;
    validate(): Promise<boolean>;
    label: string;
    errorMessage?: string;
    isReadOnly: boolean;
}

export interface ObservableFormField<V> {
    get destValue$(): Observable<V>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractSrc<T> = T extends FormField<infer S, any, any> ? S : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractDest<T> = T extends FormField<any, infer D, any> ? D : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractVP<T> = T extends FormField<any, any, infer VP> ? VP : never;

export abstract class BaseFormField<S, D, VP> implements FormField<S, D, VP> {
    protected _label = '';
    protected _errorMessage?: string;
    protected _isReadOnly = false;
    protected _validator: (value: VP) => Promise<boolean> = async () => true;

    public set label(label: string) {
        this._label = label;
    }

    public get label(): string {
        return this._label;
    }

    public set errorMessage(errorMessage: string | undefined) {
        this._errorMessage = errorMessage;
    }

    public get errorMessage(): string | undefined {
        return this._errorMessage;
    }

    public set isReadOnly(isReadOnly: boolean) {
        this._isReadOnly = isReadOnly;
    }

    public get isReadOnly(): boolean {
        return this._isReadOnly;
    }

    public abstract set srcValue(srcValue: S);

    public abstract get destValue(): Promise<D>;

    public set validator(validator: (value: VP) => Promise<boolean>) {
        this._validator = validator;
    }

    public get validator(): (value: VP) => Promise<boolean> {
        return this._validator;
    }

    public validate(): Promise<boolean> {
        return Promise.resolve(true);
    }
}
