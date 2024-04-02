import { EnvironmentInjector, Inject, Injectable, ViewContainerRef } from '@angular/core';
import { QuestionProValidationFieldComponent } from 'app/components/form-fields/question-pro-validation-field/question-pro-validation-field.component';
import { StringInputFieldComponent } from 'app/components/form-fields/string-input-field/string-input-field.component';
import type { TokenATMCredentials } from 'app/data/token-atm-credentials';
import { CredentialHandler, RegisterCredentialHandler } from 'app/services/credential-manager.service';
import { QuestionProService } from 'app/services/question-pro.service';
import { createFieldComponentWithLabel } from 'app/token-option-field-component-factories/token-option-field-component-factory';
import type { FormField } from 'app/utils/form-field/form-field';
import type { FormFieldComponentBuilder } from 'app/utils/form-field/form-field-component-builder';

export type QuestionProCredential = {
    questionProEnv: string;
    questionProUserId: string;
    questionProAPIKey: string;
};

export const QUESTION_PRO_CREDENTIAL_KEY = 'question_pro';

@RegisterCredentialHandler
@Injectable()
export class QuestionProCredentialHandler implements CredentialHandler<QuestionProCredential> {
    readonly key = QUESTION_PRO_CREDENTIAL_KEY;
    readonly descriptiveName = 'QuestionPro';
    readonly documentLink = 'https://docs.google.com/document/d/1H4cvBXV7wwVp1IA2squ0mtrug5HkDVlBf4qKhh1o_vQ/view';

    constructor(@Inject(QuestionProService) private questionProService: QuestionProService) {}

    public has(credentials: TokenATMCredentials): boolean {
        return this.key in credentials && credentials[this.key] !== undefined;
    }

    public get(credentials: TokenATMCredentials): QuestionProCredential | undefined {
        return credentials[this.key] as QuestionProCredential | undefined;
    }

    public set(credentials: TokenATMCredentials, credential: QuestionProCredential): void {
        credentials[this.key] = credential;
    }

    public delete(credentials: TokenATMCredentials): void {
        delete credentials[this.key];
    }

    public async validate(): Promise<unknown> {
        // Note: skip default validation due to API call limit
        return undefined;
    }

    public async configure(credential: QuestionProCredential): Promise<void> {
        await this.questionProService.configureCredential(credential);
    }

    public clear(): void {
        this.questionProService.clearCredential();
    }

    public generateErrorMessage(): string {
        // Note: no error message since default validation is skipped
        return '';
    }

    public isConfigured(): boolean {
        return this.questionProService.hasCredentialConfigured();
    }

    private _buildFormFieldComponentWithoutValidation(
        environmentInjector: EnvironmentInjector
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): FormFieldComponentBuilder<FormField<QuestionProCredential, QuestionProCredential, any>> {
        const validator = async ([f, v]: [StringInputFieldComponent, string]) => {
            f.errorMessage = undefined;
            if (v.trim().length == 0) {
                f.errorMessage = 'Value cannot be empty!';
                return false;
            }
            return true;
        };
        return createFieldComponentWithLabel(StringInputFieldComponent, 'Environment (ENV)', environmentInjector)
            .editField((field) => {
                field.validator = validator;
            })
            .appendBuilder(
                createFieldComponentWithLabel(StringInputFieldComponent, 'Customer ID', environmentInjector).editField(
                    (field) => {
                        field.validator = validator;
                    }
                )
            )
            .appendBuilder(
                createFieldComponentWithLabel(StringInputFieldComponent, 'API Key', environmentInjector).editField(
                    (field) => {
                        field.type = 'password';
                        field.validator = validator;
                    }
                )
            )
            .transformSrc((v: QuestionProCredential) => [v.questionProEnv, v.questionProUserId, v.questionProAPIKey])
            .transformDest(
                async ([env, userId, apiKey]: [string, string, string]) =>
                    <QuestionProCredential>{
                        questionProEnv: env,
                        questionProUserId: userId,
                        questionProAPIKey: apiKey
                    }
            );
    }

    public buildFormFieldComponent(
        environmentInjector: EnvironmentInjector
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): [(viewContainerRef: ViewContainerRef) => void, FormField<QuestionProCredential, QuestionProCredential, any>] {
        return this._buildFormFieldComponentWithoutValidation(environmentInjector)
            .wrapSuffix(createFieldComponentWithLabel(QuestionProValidationFieldComponent, '', environmentInjector))
            .build();
    }
}
