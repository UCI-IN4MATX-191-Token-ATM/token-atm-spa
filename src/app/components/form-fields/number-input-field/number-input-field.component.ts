import { Component } from '@angular/core';
import { BaseDirectFormField } from 'app/utils/form-field/direct-form-field';
import { v4 } from 'uuid';

@Component({
    selector: 'app-number-input-field',
    templateUrl: './number-input-field.component.html',
    styleUrls: ['./number-input-field.component.sass']
})
export class NumberInputFieldComponent extends BaseDirectFormField<number, [NumberInputFieldComponent, number]> {
    fieldId = v4();

    constructor() {
        super();
        this.validator = async ([field, value]: [NumberInputFieldComponent, number]) => {
            field.errorMessage = undefined;
            if (typeof value != 'number') {
                field.errorMessage = 'Value is invalid';
                return false;
            }
            return true;
        };
    }

    public override async validate(): Promise<boolean> {
        return await this._validator([this, await this.destValue]);
    }
}
