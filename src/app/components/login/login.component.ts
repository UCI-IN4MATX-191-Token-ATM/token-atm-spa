import { AfterViewInit, Component, Inject, isDevMode, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormItemInfo } from 'app/data/form-item-info';
import { TokenATMCredentials } from 'app/data/token-atm-credentials';
import { CanvasService } from 'app/services/canvas.service';
import { CredentialManagerService } from 'app/services/credential-manager.service';
import { QualtricsService } from 'app/services/qualtrics.service';

type TokenATMCredentialsAttributes = Exclude<keyof TokenATMCredentials, 'toJSON'>;

type CredentialsFormItemInfoMap = {
    [credentialID in TokenATMCredentialsAttributes]: FormItemInfo;
};

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.sass']
})
export class LoginComponent implements AfterViewInit {
    @ViewChild('retrieveCredentialModal') retrieveCredentialModal?: TemplateRef<unknown>;
    @ViewChild('storeCredentialModal') storeCredentialModal?: TemplateRef<unknown>;
    credentials = new TokenATMCredentials();
    password = '';
    isSavingCredentials = false;

    constructor(
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(QualtricsService) private qualtricsService: QualtricsService,
        @Inject(CredentialManagerService) private credentialManagerService: CredentialManagerService,
        @Inject(Router) private router: Router,
        @Inject(NgbModal) private ngbModal: NgbModal
    ) {}

    static CREDENTIALS_FORM_ITEM_INFO_MAP: CredentialsFormItemInfoMap = {
        canvasURL: new FormItemInfo(
            'canvasURL',
            'Canvas URL',
            'url',
            'https://canvas.instructure.com',
            'The URL you used to access the Canvas instance. Please remove the "/" character at the end of the URL if there is one. Example: https://canvas.eee.uci.edu'
        ),
        canvasAccessToken: new FormItemInfo(
            'canvasAccessToken',
            'Canvas Access Token',
            'password',
            '',
            'Please click your avatar on the left sidebar in Canvas and then click "Settings." In the page you are redirected to, please scroll down until you see a "New Access Token" button in a section named as "Approved Integrations." Please click that button and follow the instruction to create a new access token, copy it, and then paste it here. Example: 1081~prKixoT8pyE04DPBIgmTod2IhyVTNUj7aVhazDI3UKbwt314ha31c6YXgxCpnOxH'
        ),
        qualtricsDataCenter: new FormItemInfo(
            'qualtricsDataCenter',
            'Qualtrics Data Center',
            'text',
            '',
            'Please access the Account Settings page on Qualtrics and click the "Qualtrics IDs" tab. The value of "Datacenter ID" under the "User" table is what you want. Example: iad1'
        ),
        qualtricsClientID: new FormItemInfo(
            'qualtricsClientID',
            'Qualtrics Client ID',
            'text',
            '',
            'Please access the Account Settings page on Qualtrics and click the "Qualtrics IDs" tab. After that, clicks "OAuth Client Manager" tab. Press the "New Client" button. Please follow the instruction to create a new client. Token ATM requires two permissions: read:survey_responses and read:users. After creation, please copy & paste the Client ID and the Client Secret that pop up. Example: m2fdch523fe62h7ds896b06587fhn650'
        ),
        qualtricsClientSecret: new FormItemInfo(
            'qualtricsClientSecret',
            'Qualtrics Client Secret',
            'password',
            '',
            'Please see the tooltip for the Qualtris Client ID for more information. Please note that you can no longer access the Client Secret again once you close the window that pops up after the creation. You need to create a new Client in that case. Example: ye8gf6hGdscTFPn3zVs4Z3YI0amMk2zbccx2KJbhKv0JFrbsKFiOKPvctMYP6UjT'
        )
    };

    static CREDENTIALS_ID_LIST: TokenATMCredentialsAttributes[] = [
        'canvasURL',
        'canvasAccessToken',
        'qualtricsDataCenter',
        'qualtricsClientID',
        'qualtricsClientSecret'
    ];

    async ngAfterViewInit() {
        if (!this.retrieveCredentialModal) return;
        if (!this.credentialManagerService.hasCredentials()) return;
        if (isDevMode()) {
            const password = localStorage.getItem('password');
            if (password != null) {
                this.credentials = await this.credentialManagerService.retrieveCredentials(password);
                await this.onSubmitCredential();
                return;
            }
        }
        this.password = '';
        this.ngbModal.open(this.retrieveCredentialModal, { backdrop: 'static', keyboard: false }).result.then(
            async (result: string) => {
                switch (result) {
                    case 'delete': {
                        this.credentialManagerService.clearCredentials();
                        break;
                    }
                    case 'unlock': {
                        this.credentials = await this.credentialManagerService.retrieveCredentials(this.password);
                        await this.onSubmitCredential();
                        break;
                    }
                }
            },
            (reason: unknown) => {
                throw new Error(`Retrieve Credential Modal is dismissed unexpectedly: ${reason}`);
            }
        );
    }

    getPasswordFormItemInfo() {
        return new FormItemInfo('password', 'Password', 'password');
    }

    openLink() {
        window.open(
            'https://docs.google.com/document/d/1KzO0Aic923z5rmvbmKJJ43suaz4IwG4RhmAtLUyVfeY/edit?usp=sharing',
            '_blank'
        );
    }

    getCredentialsFormItemInfoMap(): CredentialsFormItemInfoMap {
        return LoginComponent.CREDENTIALS_FORM_ITEM_INFO_MAP;
    }

    getCredentialIDList(): TokenATMCredentialsAttributes[] {
        return LoginComponent.CREDENTIALS_ID_LIST;
    }

    hasExistingCredentials(): boolean {
        return this.credentialManagerService.hasCredentials();
    }

    async onClickSubmitButton(): Promise<void> {
        if (!this.storeCredentialModal) throw new Error('Store Credential Modal is not available');
        if (this.isSavingCredentials) {
            this.password = '';
            this.ngbModal.open(this.storeCredentialModal, { backdrop: 'static', keyboard: false }).result.then(
                async (result: string) => {
                    switch (result) {
                        case 'store': {
                            await this.credentialManagerService.storeCredentials(this.credentials, this.password);
                            await this.onSubmitCredential();
                            break;
                        }
                    }
                },
                (reason: unknown) => {
                    throw new Error(`Store Credential Modal is dismissed unexpectedly: ${reason}`);
                }
            );
            return;
        }
        await this.onSubmitCredential();
    }

    async onSubmitCredential(): Promise<void> {
        const isCanvasCredentialValid = await this.canvasService.configureCredential(
            this.credentials.canvasURL,
            this.credentials.canvasAccessToken
        );
        const isQualtricsCredentialValid = await this.qualtricsService.configureCredential(
            this.credentials.qualtricsDataCenter,
            this.credentials.qualtricsClientID,
            this.credentials.qualtricsClientSecret
        );
        if (isCanvasCredentialValid && isQualtricsCredentialValid) {
            this.credentials = new TokenATMCredentials();
            this.router.navigate(['/select-course']);
            return;
        } else {
            // TODO: handle invalid credentials
        }
    }
}
