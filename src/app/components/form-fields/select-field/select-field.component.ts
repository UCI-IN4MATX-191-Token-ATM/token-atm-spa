import { Component } from '@angular/core';
import { BaseFormField } from 'app/utils/form-field/form-field';

@Component({
    selector: 'app-select-field',
    templateUrl: './select-field.component.html',
    styleUrls: ['./select-field.component.sass']
})
export class SelectFieldComponent<T> extends BaseFormField<
    [T | undefined, [string, T][]],
    T | undefined,
    [SelectFieldComponent<T>, T | undefined]
> {
    options?: [string, T][];
    value?: T;

    public override set srcValue([value, options]: [T | undefined, [string, T][]]) {
        this.value = value;
        this.options = options;
    }

    public override get destValue(): Promise<T | undefined> {
        return Promise.resolve(this.value);
    }

    public override validate(): Promise<boolean> {
        return this.validator([this, this.value]);
    }
}
