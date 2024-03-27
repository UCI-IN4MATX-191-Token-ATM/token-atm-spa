/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import type { DirectFormField } from 'app/utils/form-field/direct-form-field';
import { BaseFormField, FormField, ObservableFormField } from 'app/utils/form-field/form-field';
import type { FormFieldComponentBuilder } from 'app/utils/form-field/form-field-component-builder';
import type { FormFieldWrapper } from 'app/utils/form-field/form-field-wrapper';
import type { Subscription } from 'rxjs';
import { SwitchFieldItemWrapperComponent } from './switch-field-item-wrapper.component';

@Component({
    selector: 'app-switch-field',
    templateUrl: './switch-field.component.html',
    styleUrls: ['./switch-field.component.sass']
})
export class SwitchFieldComponent<
        K extends string | number | symbol,
        MK extends { [P in K]: any },
        MV extends { [P in K]: any }
    >
    extends BaseFormField<
        [undefined, undefined] | { [P in K]: [P, MK[P]] }[K],
        [undefined, undefined] | { [P in K]: [P, MV[P]] }[K],
        any
    >
    implements
        FormFieldWrapper<
            DirectFormField<K | undefined, any> & ObservableFormField<K | undefined>,
            [undefined, undefined] | { [P in K]: [P, MK[P]] }[K],
            [undefined, undefined] | { [P in K]: [P, MV[P]] }[K],
            any
        >,
        OnInit,
        OnDestroy
{
    @ViewChild('container', { static: true, read: ViewContainerRef }) containerRef?: ViewContainerRef;
    private keyField?: DirectFormField<K | undefined, any> & ObservableFormField<K | undefined>;
    private subscription?: Subscription;
    private itemMap = new Map<K, SwitchFieldItemWrapperComponent>();
    private fieldMap = new Map<K, FormField<MK[K], MV[K], any>>();
    private isInitialized = false;
    private cachedRenderers: [K, (containerRef: ViewContainerRef) => void][] = [];
    private curKey?: K;

    public addField<P extends K>(key: P, fieldBuilder: FormFieldComponentBuilder<FormField<MK[P], MV[P], any>>) {
        const [renderer, field] = fieldBuilder.build();
        if (this.fieldMap.has(key)) throw new Error('Cannot add more than one field with the same key');
        this.fieldMap.set(key, field);
        if (!this.isInitialized) {
            this.cachedRenderers.push([key, renderer]);
            return;
        }
        if (!this.containerRef) throw new Error('Fail to initialize SwitchFieldComponent');
        const componentRef = this.containerRef.createComponent(SwitchFieldItemWrapperComponent);
        componentRef.instance.renderer = renderer;
        this.itemMap.set(key, componentRef.instance);
    }

    set wrappedField(wrappedField: DirectFormField<K | undefined, any> & ObservableFormField<K | undefined>) {
        this.keyField = wrappedField;
        this.subscription = wrappedField.destValue$.subscribe((x) => this.onValueUpdate(x));
    }

    private onValueUpdate(key?: K) {
        if (this.curKey == key) return;
        const oldKey = this.curKey;
        this.curKey = key;
        if (!this.isInitialized) return;
        if (oldKey !== undefined) this.itemMap.get(oldKey)?.hide();
        if (key !== undefined) this.itemMap.get(key)?.show();
    }

    public override set srcValue([key, value]: [undefined, undefined] | { [P in K]: [P, MK[P]] }[K]) {
        if (value === undefined) throw new Error('Value for switch field cannot be undefined');
        if (!this.keyField) throw new Error('Fail to initialize SwitchFieldComponent');
        this.keyField.srcValue = key;
        if (key === undefined) {
            return;
        }
        const valueField = this.fieldMap.get(key);
        if (valueField === undefined) throw new Error('Fail to find a field with the provided key');
        valueField.srcValue = value;
    }

    public override get destValue(): Promise<[undefined, undefined] | { [P in K]: [P, MV[P]] }[K]> {
        return (async () => {
            if (this.curKey === undefined) return [undefined, undefined];
            const valueField = this.fieldMap.get(this.curKey);
            if (valueField === undefined) throw new Error('Fail to find a field with the provided key');
            return [this.curKey, await valueField.destValue];
        })();
    }

    public override async validate(): Promise<boolean> {
        const keyRes = await this.keyField?.validate();
        const valueRes = this.curKey === undefined ? false : await this.fieldMap.get(this.curKey)?.validate();
        return (keyRes && valueRes) ?? false;
    }

    public override set isReadOnly(isReadOnly: boolean) {
        if (this.keyField) this.keyField.isReadOnly = isReadOnly;
        for (const field of this.fieldMap.values()) field.isReadOnly = isReadOnly;
    }

    ngOnInit() {
        if (!this.containerRef) throw new Error('Fail to initialize SwitchFieldComponent');
        for (const [key, renderer] of this.cachedRenderers) {
            const componentRef = this.containerRef.createComponent(SwitchFieldItemWrapperComponent);
            componentRef.instance.renderer = renderer;
            this.itemMap.set(key, componentRef.instance);
        }
        if (this.curKey) this.itemMap.get(this.curKey)?.show();
        this.isInitialized = true;
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }
}
