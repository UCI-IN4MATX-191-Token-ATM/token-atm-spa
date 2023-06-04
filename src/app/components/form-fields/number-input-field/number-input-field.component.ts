import { Component, Input } from '@angular/core';
import type { FormField } from 'app/utils/form-field';
import { v4 } from 'uuid';

@Component({
    selector: 'app-number-input-field',
    templateUrl: './number-input-field.component.html',
    styleUrls: ['./number-input-field.component.sass']
})
export class NumberInputFieldComponent implements FormField<number, number> {
    fieldId = v4();
    @Input() label = '';
    value = 0;
    private _validator: (value: number) => Promise<string | undefined> = async (value: number) =>
        typeof value != 'number' ? 'Value is invalid' : undefined;
    errorMessage?: string;
    readonly = false;

    @Input() set isReadOnly(isReadOnly: boolean) {
        this.readonly = isReadOnly;
    }

    @Input() set initValue(initValue: number) {
        this.value = initValue;
    }

    @Input() set validator(validator: (value: number) => Promise<string | undefined>) {
        this._validator = async (value: number) => {
            if (typeof value != 'number') return 'Value is invalid';
            return validator(value);
        };
    }

    async getValue(): Promise<number> {
        return this.value;
    }

    async validate(): Promise<boolean> {
        const result = await this._validator(await this.getValue());
        this.errorMessage = result;
        return result == undefined;
    }
}
