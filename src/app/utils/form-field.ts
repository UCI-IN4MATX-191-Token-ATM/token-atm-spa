export interface FormField<S, T> {
    set isReadOnly(isReadOnly: boolean);
    set initValue(initValue: S);
    set validator(validator: <V extends T>(value: V) => Promise<string | undefined>);
    getValue(): Promise<T>;
    validate(): Promise<boolean>;
}
