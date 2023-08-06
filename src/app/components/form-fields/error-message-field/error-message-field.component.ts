import { Component } from '@angular/core';
import { BaseDirectFormField } from 'app/utils/form-field/direct-form-field';

@Component({
    selector: 'app-error-message-field',
    templateUrl: './error-message-field.component.html',
    styleUrls: ['./error-message-field.component.sass']
})
export class ErrorMessageFieldComponent extends BaseDirectFormField<string | undefined, ErrorMessageFieldComponent> {}
