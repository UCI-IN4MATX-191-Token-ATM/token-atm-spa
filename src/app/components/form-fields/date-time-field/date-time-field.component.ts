import { Component } from '@angular/core';
import { BaseFormField } from 'app/utils/form-field/form-field';
import { getDate, getMonth, getYear, isValid, set } from 'date-fns';
import formatInTimeZone from 'date-fns-tz/formatInTimeZone';

@Component({
    selector: 'app-date-time-field',
    templateUrl: './date-time-field.component.html',
    styleUrls: ['./date-time-field.component.sass']
})
export class DateTimeFieldComponent extends BaseFormField<
    Date | [Date, string],
    Date,
    [DateTimeFieldComponent, Date, boolean]
> {
    isTimeValid = true;
    static localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    private courseTimeZone: string;
    courseTime?: string;
    protected value: Date;

    constructor() {
        super();
        this.value = new Date();
        this.courseTimeZone = '';
        this.validator = DateTimeFieldComponent.DEFAULT_VALIDATOR;
        this.courseTime = undefined;
        DateTimeFieldComponent.localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
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
        this.onValueChange('time', event);
    }

    public onValueChange(flag: 'date' | 'time', event: unknown): void {
        if (flag === 'date') {
            const d = event as Date;
            this.value = set(this.value, { year: getYear(d), month: getMonth(d), date: getDate(d) });
        }
        if (this.courseTimeZone === '' || this.courseTimeZone === DateTimeFieldComponent.localTimeZone) {
            this.courseTime = undefined;
            return;
        }
        if (!this.isTimeValid || !isValid(this.value)) this.courseTime = 'Course Time: ';
        this.courseTime = `Course Time: ${formatInTimeZone(this.value, this.courseTimeZone, 'MMM dd, yyyy HH:mm:ss')}`;
    }

    public override set srcValue(srcValue: Date | [Date, string]) {
        if (Array.isArray(srcValue)) {
            this.value = srcValue[0];
            this.courseTimeZone = srcValue[1];
        } else {
            this.value = srcValue;
            this.courseTimeZone = '';
        }
    }

    public override get destValue(): Promise<Date> {
        return Promise.resolve(this.value);
    }

    public override async validate(): Promise<boolean> {
        return await this._validator([this, await this.destValue, this.isTimeValid]);
    }
}
