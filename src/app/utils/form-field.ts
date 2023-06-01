export interface FormField<T> {
    set isReadOnly(isReadOnly: boolean);
    set initValue(initValue: T);
    set validator(validator: (value: T) => string | undefined);
    getValue(): Promise<T>;
    validate(): Promise<boolean>;
}
