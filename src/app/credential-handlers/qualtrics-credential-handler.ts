import { Injectable, type EnvironmentInjector, type ViewContainerRef, Inject } from '@angular/core';
import { ErrorMessageFieldComponent } from 'app/components/form-fields/error-message-field/error-message-field.component';
import { StringInputFieldComponent } from 'app/components/form-fields/string-input-field/string-input-field.component';
import type { TokenATMCredentials } from 'app/data/token-atm-credentials';
import { RegisterCredentialHandler, type CredentialHandler } from 'app/services/credential-manager.service';
import { QualtricsService } from 'app/services/qualtrics.service';
import { createFieldComponentWithLabel } from 'app/token-options/token-option-field-component-factory';
import type { FormField } from 'app/utils/form-field/form-field';

export type QualtricsCredential = {
    qualtricsDataCenter: string;
    qualtricsClientID: string;
    qualtricsClientSecret: string;
};

const QUALTRICS_CREDENTIAL_KEY = 'qualtrics';

@RegisterCredentialHandler
@Injectable()
export class QualtricsCredentialHandler implements CredentialHandler<QualtricsCredential> {
    readonly key = QUALTRICS_CREDENTIAL_KEY;
    readonly descriptiveName = 'Qualtrics';
    readonly documentLink = 'https://docs.google.com/document/d/1H4cvBXV7wwVp1IA2squ0mtrug5HkDVlBf4qKhh1o_vQ/view';

    constructor(@Inject(QualtricsService) private qualtricsService: QualtricsService) {}

    public has(credentials: TokenATMCredentials): boolean {
        return this.key in credentials && credentials[this.key] !== undefined;
    }

    public get(credentials: TokenATMCredentials): QualtricsCredential | undefined {
        return credentials[this.key] as QualtricsCredential | undefined;
    }

    public set(credentials: TokenATMCredentials, credential: QualtricsCredential): void {
        credentials[this.key] = credential;
    }

    public delete(credentials: TokenATMCredentials): void {
        delete credentials[this.key];
    }

    public validate(credential: QualtricsCredential): Promise<unknown> {
        return this.qualtricsService.validateCredential(credential);
    }

    public async configure(credential: QualtricsCredential): Promise<void> {
        await this.qualtricsService.configureCredential(credential);
    }

    public clear(): void {
        this.qualtricsService.clearCredential();
    }

    public generateErrorMessage(): string {
        return 'QUALTRICS\nToken ATM couldn’t verify your credentials with Qualtrics. \nDouble check that you are providing the correct credentials, that your account has API access, and that the credentials have the scopes read:users and read:survey_responses.\n';
    }

    isConfigured(): boolean {
        return this.qualtricsService.hasCredentialConfigured();
    }

    buildFormFieldComponent(
        environmentInjector: EnvironmentInjector
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): [(viewContainerRef: ViewContainerRef) => void, FormField<QualtricsCredential, QualtricsCredential, any>] {
        return createFieldComponentWithLabel(StringInputFieldComponent, 'Qualtrics Data Center', environmentInjector)
            .appendBuilder(
                createFieldComponentWithLabel(StringInputFieldComponent, 'Qualtrics Client ID', environmentInjector)
            )
            .appendBuilder(
                createFieldComponentWithLabel(
                    StringInputFieldComponent,
                    'Qualtrics Client Secret',
                    environmentInjector
                ).editField((field) => {
                    field.type = 'password';
                })
            )
            .transformDest(
                async ([dataCenter, clientID, clientSecret]: [
                    string,
                    string,
                    string
                ]): Promise<QualtricsCredential> => {
                    return {
                        qualtricsDataCenter: dataCenter,
                        qualtricsClientID: clientID,
                        qualtricsClientSecret: clientSecret
                    };
                }
            )
            .appendBuilder(createFieldComponentWithLabel(ErrorMessageFieldComponent, '', environmentInjector))
            .editField((field) => {
                field.validator = async (value: typeof field) => {
                    const credential = (await value.destValue)[0];
                    value.fieldB.srcValue = undefined;
                    const res = await this.qualtricsService.validateCredential(credential);
                    if (res === undefined) return true;
                    value.fieldB.srcValue = `Error occurred when configuring Qualtrics credential: please click the "Help" button in the title to view documentation.`;
                    return false;
                };
            })
            .transformSrc((credential: QualtricsCredential) => [
                credential.qualtricsDataCenter,
                credential.qualtricsClientID,
                credential.qualtricsClientSecret,
                undefined
            ])
            .transformDest(async (v) => v[0])
            .build();
    }
}
