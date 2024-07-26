import { Component } from '@angular/core';
import { BaseDirectFormField } from 'app/utils/form-field/direct-form-field';
import { v4 } from 'uuid';

@Component({
    selector: 'app-string-input-field',
    templateUrl: './string-input-field.component.html',
    styleUrls: ['./string-input-field.component.sass']
})
export class StringInputFieldComponent extends BaseDirectFormField<string, [StringInputFieldComponent, string]> {
    fieldId = v4();
    type = 'string';

    public override async validate(): Promise<boolean> {
        return await this._validator([this, await this.destValue]);
    }
}
