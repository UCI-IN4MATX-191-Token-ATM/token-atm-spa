import { Component, Input } from '@angular/core';
import type { FormField } from 'app/utils/form-field';
import { isValid } from 'date-fns';

@Component({
    selector: 'app-date-time-field',
    templateUrl: './date-time-field.component.html',
    styleUrls: ['./date-time-field.component.sass']
})
export class DateTimeFieldComponent implements FormField<Date, Date> {
    @Input() label = '';
    value = new Date();
    private _validator: (value: Date, isTimeValid: boolean) => Promise<string | undefined> =
        DateTimeFieldComponent.DEFAULT_VALIDATOR;
    errorMessage?: string;
    private _isReadOnly = false;
    isTimeValid = true;

    private static DEFAULT_VALIDATOR = async (value: Date, isTimeValid: boolean) => {
        if (!isTimeValid) {
            return 'Time is invalid';
        }
        if (!isValid(value)) return 'Date is invalid';
        return undefined;
    };

    @Input() set isReadOnly(isReadOnly: boolean) {
        this._isReadOnly = isReadOnly;
    }

    get isReadOnly(): boolean {
        return this._isReadOnly;
    }

    @Input() set initValue(initValue: Date) {
        this.value = initValue;
    }

    @Input() set validator(validator: (value: Date) => Promise<string | undefined>) {
        this._validator = async (value: Date, isTimeValid: boolean) => {
            const result = DateTimeFieldComponent.DEFAULT_VALIDATOR(value, isTimeValid);
            if (result != undefined) return result;
            return validator(value);
        };
    }

    async getValue(): Promise<Date> {
        return this.value;
    }

    async validate(): Promise<boolean> {
        const result = await this._validator(await this.getValue(), this.isTimeValid);
        this.errorMessage = result;
        return result == undefined;
    }
}
