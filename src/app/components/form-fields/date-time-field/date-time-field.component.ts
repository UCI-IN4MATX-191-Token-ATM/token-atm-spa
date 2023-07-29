import { Component } from '@angular/core';
import { BaseDirectFormField } from 'app/utils/form-field/direct-form-field';
import { isValid } from 'date-fns';

@Component({
    selector: 'app-date-time-field',
    templateUrl: './date-time-field.component.html',
    styleUrls: ['./date-time-field.component.sass']
})
export class DateTimeFieldComponent extends BaseDirectFormField<Date, [DateTimeFieldComponent, Date, boolean]> {
    isTimeValid = true;

    constructor() {
        super();
        this.value = new Date();
        this.validator = DateTimeFieldComponent.DEFAULT_VALIDATOR;
    }

    public static DEFAULT_VALIDATOR = async ([field, value, isTimeValid]: [DateTimeFieldComponent, Date, boolean]) => {
        field.errorMessage = undefined;
        if (!isTimeValid) {
            field.errorMessage = 'Time is invalid';
            return false;
        }
        if (!isValid(value)) {
            field.errorMessage = 'Date is invalid';
            return false;
        }
        return true;
    };

    public override async validate(): Promise<boolean> {
        return await this._validator([this, await this.destValue, this.isTimeValid]);
    }
}
