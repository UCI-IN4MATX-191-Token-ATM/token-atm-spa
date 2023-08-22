import type { ComponentRef, ViewContainerRef } from '@angular/core';
import type { ExtractDest, ExtractSrc, ExtractVP, FormField } from './form-field';
import { FormFieldAppender } from './form-field-appender';
import { FormFieldSrcTransformer } from './form-field-src-transformer';
import { FormFieldModifier, type FormFieldModifierConfig } from './form-field-modifier';
import { FormFieldDestTransformer } from './form-field-dest-transformer';
import { FormFieldVPTransformer } from './form-field-vp-transformer';
import { FormFieldVPAppender } from './form-field-vp-appender';

export type TupleAppend<A, B> = A extends unknown[] ? [...A, B] : [A, B];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class FormFieldComponentBuilder<F extends FormField<any, any, any>> {
    private _components: ComponentRef<unknown>[];

    constructor(components: ComponentRef<unknown>[] = [], private field?: F) {
        this._components = components?.slice(0);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public setComp<F1 extends FormField<any, any, any>>(compRef: ComponentRef<F1>): FormFieldComponentBuilder<F1> {
        for (const component of this._components) component.destroy();
        return new FormFieldComponentBuilder([compRef], compRef.instance);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public appendComp<F1 extends FormField<any, any, any>>(
        compRef: ComponentRef<F1>
    ): FormFieldComponentBuilder<FormFieldAppender<F, F1>> {
        if (!this.field) throw new Error('No field to append');
        this._components.push(compRef);
        return new FormFieldComponentBuilder(this._components, new FormFieldAppender(this.field, compRef.instance));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public appendField<F1 extends FormField<any, any, any>>(
        field: F1
    ): FormFieldComponentBuilder<FormFieldAppender<F, F1>> {
        if (!this.field) throw new Error('No field to append');
        return new FormFieldComponentBuilder(this._components, new FormFieldAppender(this.field, field));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public appendBuilder<F1 extends FormField<any, any, any>>(
        builder: FormFieldComponentBuilder<F1>
    ): FormFieldComponentBuilder<FormFieldAppender<F, F1>> {
        if (!this.field || !builder.field) throw new Error('No field to append');
        return new FormFieldComponentBuilder(
            this._components.concat(builder._components),
            new FormFieldAppender(this.field, builder.field)
        );
    }

    public transformSrc<S1>(
        srcTransformer: (key: S1) => ExtractSrc<F>
    ): FormFieldComponentBuilder<FormFieldSrcTransformer<F, S1>> {
        if (!this.field) throw new Error('No field to transform');
        return new FormFieldComponentBuilder(this._components, new FormFieldSrcTransformer(this.field, srcTransformer));
    }

    public transformDest<D1>(
        destTransformer: (value: ExtractDest<F>) => Promise<D1>
    ): FormFieldComponentBuilder<FormFieldDestTransformer<F, D1>> {
        if (!this.field) throw new Error('No field to transform');
        return new FormFieldComponentBuilder(
            this._components,
            new FormFieldDestTransformer(this.field, destTransformer)
        );
    }

    public transformVP<VP1>(
        VPTransformer: (value: ExtractVP<F>) => Promise<VP1>
    ): FormFieldComponentBuilder<FormFieldVPTransformer<F, VP1>> {
        if (!this.field) throw new Error('No field to transform');
        return new FormFieldComponentBuilder(this._components, new FormFieldVPTransformer(this.field, VPTransformer));
    }

    public appendVP<VP1>(
        VPTransformer: (value: F) => Promise<VP1>
    ): FormFieldComponentBuilder<FormFieldVPAppender<F, VP1>> {
        if (!this.field) throw new Error('No field to transform');
        return new FormFieldComponentBuilder(this._components, new FormFieldVPAppender(this.field, VPTransformer));
    }

    public modify(config: FormFieldModifierConfig<F>): FormFieldComponentBuilder<FormFieldModifier<F>> {
        if (!this.field) throw new Error('No field to modify');
        return new FormFieldComponentBuilder(this._components, new FormFieldModifier(this.field, config));
    }

    public getField(): F {
        if (!this.field) throw new Error('No field to get');
        return this.field;
    }

    public editField(executor: (field: F) => void): FormFieldComponentBuilder<F> {
        if (!this.field) throw new Error('No field to edit');
        executor(this.field);
        return this;
    }

    public build(): [(viewContainerRef: ViewContainerRef) => void, F] {
        if (!this.field) throw new Error('No field to build');
        return [
            (container) => {
                for (const component of this._components) container.insert(component.hostView);
            },
            this.field
        ];
    }
}
