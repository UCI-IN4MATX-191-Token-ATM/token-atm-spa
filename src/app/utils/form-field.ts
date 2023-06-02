export interface FormField<S, T> {
    set isReadOnly(isReadOnly: boolean);
    set initValue(initValue: S);
    set validator(validator: (value: T) => string | undefined);
    getValue(): Promise<T>;
    validate(): Promise<boolean>;
}
