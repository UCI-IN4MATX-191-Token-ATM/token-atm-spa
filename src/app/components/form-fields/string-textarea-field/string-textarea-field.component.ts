import { Component, Input } from '@angular/core';
import type { FormField } from 'app/utils/form-field';
import { v4 } from 'uuid';

@Component({
    selector: 'app-string-textarea-field',
    templateUrl: './string-textarea-field.component.html',
    styleUrls: ['./string-textarea-field.component.sass']
})
export class StringTextareaFieldComponent implements FormField<string, string> {
    fieldId = v4();
    @Input() label = '';
    @Input() rows = 3;
    value = '';
    private _validator: (value: string) => Promise<string | undefined> = async () => undefined;
    errorMessage?: string;
    readonly = false;

    @Input() set isReadOnly(isReadOnly: boolean) {
        this.readonly = isReadOnly;
    }

    @Input() set initValue(initValue: string) {
        this.value = initValue;
    }

    @Input() set validator(validator: (value: string) => Promise<string | undefined>) {
        this._validator = validator;
    }

    async getValue(): Promise<string> {
        return this.value;
    }

    async validate(): Promise<boolean> {
        const result = await this._validator(await this.getValue());
        this.errorMessage = result;
        return result == undefined;
    }
}
