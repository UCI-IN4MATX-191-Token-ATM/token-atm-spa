export interface FormFieldCopyPasteHandler<T> {
    serialize: (value: T) => Promise<string>;
    deserialize: (value: string) => Promise<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DEFAULT_JSON_FORM_FIELD_COPY_PASTE_HANDLER = <FormFieldCopyPasteHandler<any>>{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serialize: async (value: any) => JSON.stringify(value),
    deserialize: async (value: string) => JSON.parse(value)
};
