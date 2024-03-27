import { Component, Inject } from '@angular/core';
import type { QuestionProCredential } from 'app/credential-handlers/question-pro-credential-handler';
import { QuestionProService } from 'app/services/question-pro.service';
import { ErrorSerializer } from 'app/utils/error-serailizer';
import type { ExtractDest, ExtractSrc, ExtractVP, FormField } from 'app/utils/form-field/form-field';
import type { FormFieldWrapper } from 'app/utils/form-field/form-field-wrapper';
import { ForwardFormField } from 'app/utils/form-field/forward-form-field';
import { format } from 'date-fns';

@Component({
    selector: 'app-question-pro-validation-field',
    templateUrl: './question-pro-validation-field.component.html',
    styleUrls: ['./question-pro-validation-field.component.sass']
})
export class QuestionProValidationFieldComponent<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        F extends FormField<QuestionProCredential, QuestionProCredential, any>
    >
    extends ForwardFormField<F>
    implements FormFieldWrapper<F, ExtractSrc<F>, ExtractDest<F>, ExtractVP<F>>
{
    isProcessing = false;
    message?: string = undefined;

    constructor(@Inject(QuestionProService) private questionProService: QuestionProService) {
        super();
    }

    set wrappedField(wrappedField: F) {
        this.forwardedTo = wrappedField;
    }

    public async onManualValidate(): Promise<void> {
        if (!this.forwardedTo) return;
        this.isProcessing = true;
        this.message = undefined;
        const result = await this.questionProService.validateCredential(await this.forwardedTo.destValue);
        if (result === undefined) {
            this.message = `QuestionPro credential has been validated successfully at ${format(
                new Date(),
                'MMM dd, yyyy HH:mm:ss'
            )}!`;
        } else {
            this.message = `QuestionPro credential validation failed at ${format(
                new Date(),
                'MMM dd, yyyy HH:mm:ss'
            )}: ${ErrorSerializer.serailize(result)}`;
        }
        this.isProcessing = false;
    }

    get canValidate(): boolean {
        return this.forwardedTo !== undefined && !this.isProcessing;
    }
}
