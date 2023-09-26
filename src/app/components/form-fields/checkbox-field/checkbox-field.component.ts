import { Component } from '@angular/core';
import { BaseDirectFormField } from 'app/utils/form-field/direct-form-field';

@Component({
    selector: 'app-checkbox-field',
    templateUrl: './checkbox-field.component.html',
    styleUrls: ['./checkbox-field.component.sass']
})
export class CheckboxFieldComponent extends BaseDirectFormField<boolean, [CheckboxFieldComponent, boolean]> {
    constructor() {
        super();
        this.value = false;
    }

    public override validate(): Promise<boolean> {
        return this.validator([this, this.value ?? false]);
    }
}
