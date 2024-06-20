import { Component, Input, type OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BaseFormField, type ExtractDest, type ExtractSrc, type FormField } from 'app/utils/form-field/form-field';
import type { FormFieldComponentBuilder } from 'app/utils/form-field/form-field-component-builder';

@Component({
    selector: 'app-optional-field',
    templateUrl: './optional-field.component.html',
    styleUrls: ['./optional-field.component.sass']
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class OptionalFieldComponent<T extends FormField<any, any, any>>
    extends BaseFormField<[boolean, ExtractSrc<T>], undefined | ExtractDest<T>, [boolean, T | undefined]>
    implements OnInit
{
    isShown = false;
    @Input() fieldBuilder?: FormFieldComponentBuilder<T>;
    private _field?: T;

    @ViewChild('fieldContainer', { read: ViewContainerRef, static: true }) private fieldContainerRef?: ViewContainerRef;
    private cachedSrcValue: ExtractSrc<T> | undefined = undefined;

    ngOnInit(): void {
        if (!this.fieldBuilder || !this.fieldContainerRef)
            throw new Error('Failed to initialize optional field component');
        const [renderer, field] = this.fieldBuilder.build();
        this._field = field;
        this._field.isReadOnly = this.isReadOnly;
        if (this.cachedSrcValue !== undefined) {
            this._field.srcValue = this.cachedSrcValue;
            this.cachedSrcValue = undefined;
        }
        renderer(this.fieldContainerRef);
    }

    set srcValue([isShown, srcValue]: [boolean, ExtractSrc<T>]) {
        this.isShown = isShown;
        if (!this._field) {
            this.cachedSrcValue = srcValue;
        } else {
            this._field.srcValue = srcValue;
        }
    }

    get destValue(): Promise<undefined | ExtractDest<T>> {
        return Promise.resolve(this.isShown ? this._field?.destValue : undefined);
    }

    override set isReadOnly(isReadOnly: boolean) {
        this._isReadOnly = isReadOnly;
        if (this._field) this._field.isReadOnly = isReadOnly;
    }

    override get isReadOnly(): boolean {
        return this._isReadOnly;
    }

    public override async validate(): Promise<boolean> {
        if (!this.isShown) return this._validator([this.isShown, this._field]);
        if (!this._field) return false;
        const result = await this._field.validate();
        if (!result) return false;
        return this._validator([this.isShown, this._field]);
    }
}
