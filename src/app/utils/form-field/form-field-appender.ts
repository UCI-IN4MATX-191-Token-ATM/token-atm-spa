import { BaseFormField, type ExtractDest, type ExtractSrc, type FormField } from './form-field';
import type { TupleAppend } from './form-field-component-builder';

export class FormFieldAppender<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    F1 extends FormField<any, any, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    F2 extends FormField<any, any, any>
> extends BaseFormField<
    TupleAppend<ExtractSrc<F1>, ExtractSrc<F2>>,
    TupleAppend<ExtractDest<F1>, ExtractDest<F2>>,
    FormFieldAppender<F1, F2>
> {
    constructor(public fieldA: F1, public fieldB: F2) {
        super();
    }

    public override set isReadOnly(isReadOnly: boolean) {
        this.fieldA.isReadOnly = isReadOnly;
        this.fieldB.isReadOnly = isReadOnly;
    }

    public override set srcValue(srcValue: TupleAppend<ExtractSrc<F1>, ExtractSrc<F2>>) {
        if (srcValue.length == 2) {
            this.fieldA.srcValue = srcValue[0] as ExtractSrc<F1>;
            this.fieldB.srcValue = srcValue[1] as ExtractSrc<F2>;
        } else {
            this.fieldA.srcValue = srcValue.slice(0, srcValue.length - 1) as ExtractSrc<F1>;
            this.fieldB.srcValue = srcValue[srcValue.length - 1] as ExtractSrc<F2>;
        }
    }

    public override get destValue(): Promise<TupleAppend<ExtractDest<F1>, ExtractDest<F2>>> {
        return (async () => {
            const valueA = await this.fieldA.destValue;
            const valueB = await this.fieldB.destValue;
            if (Array.isArray(valueA)) return [...valueA, valueB] as TupleAppend<ExtractDest<F1>, ExtractDest<F2>>;
            return [valueA, valueB] as TupleAppend<ExtractDest<F1>, ExtractDest<F2>>;
        })();
    }

    public override async validate(): Promise<boolean> {
        let result = true;
        const resultA = await this.fieldA.validate();
        const resultB = await this.fieldB.validate();
        const resultC = await this._validator(this);
        result &&= resultA;
        result &&= resultB;
        result &&= resultC;
        return result;
    }
}
