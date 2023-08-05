import { Component, Input, OnInit, Type, ViewChild, ViewContainerRef } from '@angular/core';
import type { FormField } from 'app/utils/form-field/form-field';

type ComponentList<T extends [unknown, unknown, unknown][]> = {
    [I in keyof T]: T[I] extends [infer K, infer V, infer VP] ? FormField<K, V, VP> : never;
};

type TypeWrapper<T extends ComponentList<[unknown, unknown, unknown][]>> = {
    [I in keyof T]: Type<T[I]>;
};

type KeyExtractor<T extends [unknown, unknown, unknown][]> = {
    [I in keyof T]: T[I] extends [infer K, unknown] ? K : never;
};

type ValueExtractor<T extends [unknown, unknown, unknown][]> = {
    [I in keyof T]: T[I] extends [unknown, infer V, unknown] ? V : never;
};

@Component({
    selector: 'app-concatenate-field',
    templateUrl: './concatenate-field.component.html',
    styleUrls: ['./concatenate-field.component.sass']
})
export class ConcatenateFieldComponent<T extends [unknown, unknown, unknown][], K, V>
    implements OnInit, FormField<K, V, V>
{
    @Input() componentTypeList?: TypeWrapper<ComponentList<T>>;
    @Input() componentInitializers?: (componentList: ComponentList<T>) => void;
    @Input() srcValueSetter: (initValue: K, componentList: ComponentList<T>) => void = (srcValue, componentList) => {
        const values = srcValue as KeyExtractor<T>;
        for (let i = 0; i < componentList.length; i++) {
            const component = componentList[i];
            if (!component) break;
            component.srcValue = values[i];
        }
    };
    @Input() resultTransformer: (values: ValueExtractor<T>) => Promise<V> = async (values) => values as V;
    @Input() set isReadOnly(isReadOnly: boolean) {
        this.componentList?.forEach((component) => {
            component.isReadOnly = isReadOnly;
        });
    }
    @Input() set srcValue(srcValue: K) {
        if (!this.componentList) {
            this.delayedInitValue = srcValue;
            return;
        }
        this.srcValueSetter(srcValue, this.componentList);
    }

    @ViewChild('container', { read: ViewContainerRef, static: true }) containerRef?: ViewContainerRef;
    private componentList?: ComponentList<T>;
    private _validator?: (value: V) => Promise<boolean>;
    private delayedInitValue?: K;

    public set label(_: string) {
        // Ignore label
    }

    public set validator(validator: (value: V) => Promise<boolean>) {
        this._validator = validator;
    }

    ngOnInit(): void {
        if (!this.componentTypeList || !this.componentInitializers || !this.containerRef)
            throw new Error('Invalid initialization of ConcatenateField');
        this.componentList = this.componentTypeList.map((componentType) => {
            if (!this.containerRef) throw new Error('Invalid initialization of ConcatenateField');
            return this.containerRef.createComponent(componentType).instance;
        }) as ComponentList<T>;
        this.componentInitializers(this.componentList);
        if (this.delayedInitValue != undefined) this.srcValueSetter(this.delayedInitValue, this.componentList);
        this.delayedInitValue = undefined;
    }

    public get destValue(): Promise<V> {
        return (async () => {
            if (!this.componentList) throw new Error('Invalid ConcatenateField');
            return this.resultTransformer(
                (await Promise.all(this.componentList.map((component) => component.destValue))) as ValueExtractor<T>
            );
        })();
    }

    public async validate(): Promise<boolean> {
        if (!this.componentList) return false;
        let result = true;
        for (const component of this.componentList) {
            const tmpResult = await component.validate();
            result &&= tmpResult;
        }
        const curResult = !this._validator ? true : await this._validator(await this.destValue);
        result &&= curResult;
        return result;
    }
}
