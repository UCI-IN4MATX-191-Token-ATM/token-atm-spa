import { Component } from '@angular/core';
import { BaseDirectFormField } from 'app/utils/form-field/direct-form-field';
import { isValid } from 'date-fns';
import formatInTimeZone from 'date-fns-tz/formatInTimeZone';

@Component({
    selector: 'app-date-time-field',
    templateUrl: './date-time-field.component.html',
    styleUrls: ['./date-time-field.component.sass']
})
export class DateTimeFieldComponent extends BaseDirectFormField<Date, [DateTimeFieldComponent, Date, boolean]> {
    isTimeValid = true;
    private localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    private courseTimeZone?: string; // TODO: expose courseTimeZone
    courseTime?: string = undefined;

    constructor() {
        super();
        this.value = new Date();
        this.courseTimeZone = undefined; // TODO: Remove, used to manually test  implementation
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

    public validTimeChange(event: boolean): void {
        this.isTimeValid = event;
        this.onValueChange(event);
    }

    public onValueChange(event: any): void {
        event;
        const courseTimeZone = this.courseTimeZone;
        if (!(this.value ?? false) || !this.isTimeValid || !isValid(this.value!)) this.courseTime = undefined;
        if (courseTimeZone == null || courseTimeZone === this.localTimeZone) return;
        this.courseTime = `Course Time: ${formatInTimeZone(this.value!, this.localTimeZone, 'MMM dd, yyyy HH:mm:ss')}`;
    }

    public override async validate(): Promise<boolean> {
        return await this._validator([this, await this.destValue, this.isTimeValid]);
    }
}
