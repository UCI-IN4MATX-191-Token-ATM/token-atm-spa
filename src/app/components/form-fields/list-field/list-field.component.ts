import { Component, ComponentRef, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import type { ExtractDest, ExtractSrc, FormField } from 'app/utils/form-field/form-field';
import { ListFieldItemWrapperComponent } from '../list-field-item-wrapper/list-field-item-wrapper.component';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-list-field',
    templateUrl: './list-field.component.html',
    styleUrls: ['./list-field.component.sass']
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ListFieldComponent<F extends FormField<any, any, any>>
    implements OnInit, FormField<ExtractSrc<F>[], ExtractDest<F>[], F[]>
{
    @Input() fieldFactory?: () => [(viewContainerRef: ViewContainerRef) => void, F];
    @ViewChild('container', { read: ViewContainerRef, static: true }) viewContainerRef?: ViewContainerRef;
    private delayedInitValue?: ExtractSrc<F>[];
    private isInitialized = false;
    private itemRefs: ComponentRef<ListFieldItemWrapperComponent>[] = [];
    private fields: F[] = [];
    private _validator?: (value: F[]) => Promise<boolean>;
    private _isReadOnly = false;

    addItem(value?: ExtractSrc<F>) {
        if (!this.fieldFactory || !this.viewContainerRef) throw new Error('Invalid initialization of ListField');
        const [renderer, field] = this.fieldFactory(),
            item = this.viewContainerRef.createComponent(ListFieldItemWrapperComponent);
        item.instance.renderer = renderer;
        if (value != undefined) field.srcValue = value;
        firstValueFrom(item.instance.remove).then(() => {
            const itemInd = this.itemRefs.indexOf(item);
            if (itemInd != -1) {
                this.itemRefs.splice(itemInd, 1);
                this.fields.splice(itemInd, 1);
            }
            item.destroy();
        });
        this.itemRefs.push(item);
        this.fields.push(field);
        field.isReadOnly = this.isReadOnly;
        item.instance.isReadOnly = this.isReadOnly;
    }

    private cleanup() {
        this.itemRefs.forEach((itemRef) => itemRef.destroy());
        this.fields = [];
    }

    private initWith(values: ExtractSrc<F>[]) {
        this.cleanup();
        for (const value of values) this.addItem(value);
    }

    ngOnInit() {
        this.isInitialized = true;
        if (this.delayedInitValue) this.initWith(this.delayedInitValue);
        this.delayedInitValue = undefined;
    }

    public set isReadOnly(isReadOnly: boolean) {
        this._isReadOnly = isReadOnly;
        for (const field of this.fields) field.isReadOnly = isReadOnly;
        for (const itemRef of this.itemRefs) itemRef.instance.isReadOnly = isReadOnly;
    }

    public get isReadOnly(): boolean {
        return this._isReadOnly;
    }

    public set srcValue(srcValue: ExtractSrc<F>[]) {
        if (!this.isInitialized) {
            this.delayedInitValue = srcValue;
            return;
        }
        this.initWith(srcValue);
    }

    public set label(_: string) {
        // Ignore label
    }

    public set validator(validator: (value: F[]) => Promise<boolean>) {
        this._validator = validator;
    }

    public get destValue(): Promise<ExtractDest<F>[]> {
        return Promise.all(this.fields.map((field) => field.destValue));
    }

    public async validate(): Promise<boolean> {
        if (!this.isInitialized) return false;
        let result = true;
        for (const field of this.fields) {
            const tmpResult = await field.validate();
            result &&= tmpResult;
        }
        const curResult = !this._validator ? true : await this._validator(this.fields);
        result &&= curResult;
        return result;
    }
}
