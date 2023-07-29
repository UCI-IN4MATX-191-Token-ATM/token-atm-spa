import { Component, Input } from '@angular/core';
import { BaseDirectFormField } from 'app/utils/form-field/direct-form-field';
import { v4 } from 'uuid';

@Component({
    selector: 'app-string-textarea-field',
    templateUrl: './string-textarea-field.component.html',
    styleUrls: ['./string-textarea-field.component.sass']
})
export class StringTextareaFieldComponent extends BaseDirectFormField<string, [StringTextareaFieldComponent, string]> {
    fieldId = v4();
    @Input() rows = 3;

    public override async validate(): Promise<boolean> {
        return await this.validator([this, await this.destValue]);
    }
}
