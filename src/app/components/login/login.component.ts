import { AfterViewInit, Component, Inject, isDevMode, SecurityContext, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormItemInfo } from 'app/data/form-item-info';
import type { CanvasCredential, TokenATMCredentials } from 'app/data/token-atm-credentials';
import { CanvasService } from 'app/services/canvas.service';
import { StorageManagerService } from 'app/services/storage-manager.service';
import { ModalManagerService } from 'app/services/modal-manager.service';
import { ErrorSerializer } from 'app/utils/error-serailizer';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { DomSanitizer } from '@angular/platform-browser';
import { pluralize } from 'app/utils/pluralize';
import { OptionalCredentialManagementComponent } from '../optional-credential-management/optional-credential-management.component';
import { CredentialManagerService } from 'app/services/credential-manager.service';

type CanvasCredentialAttributes = keyof CanvasCredential;

type CanvasCredentialFormItemInfoMap = {
    [credentialID in CanvasCredentialAttributes]: FormItemInfo;
};

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.sass']
})
export class LoginComponent implements AfterViewInit {
    @ViewChild('retrieveCredentialModal') retrieveCredentialModalTemplate?: TemplateRef<unknown>;
    @ViewChild('storeCredentialModal') storeCredentialModalTemplate?: TemplateRef<unknown>;
    retrieveCredentialModalRef?: BsModalRef<unknown>;
    storeCredentialModalRef?: BsModalRef<unknown>;
    credentials: TokenATMCredentials = {
        canvas: {
            canvasURL: '',
            canvasAccessToken: ''
        }
    };
    password = '';
    loadCredentialErrorMessage: string | undefined = undefined;
    isSavingCredentials = false;
    isProcessing = false;

    constructor(
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(StorageManagerService) private storageManagerService: StorageManagerService,
        @Inject(Router) private router: Router,
        @Inject(BsModalService) private modalService: BsModalService,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService,
        @Inject(DomSanitizer) private sanitizer: DomSanitizer,
        @Inject(CredentialManagerService) private credentialManagerService: CredentialManagerService
    ) {}

    static CANVAS_CREDENTIAL_FORM_ITEM_INFO_MAP: CanvasCredentialFormItemInfoMap = {
        canvasURL: new FormItemInfo(
            'canvasURL',
            'Canvas URL',
            'url',
            'https://canvas.instructure.com',
            'The URL you use to access your Canvas instance. \nExample: https://canvas.eee.uci.edu'
        ),
        canvasAccessToken: new FormItemInfo(
            'canvasAccessToken',
            'Canvas Access Token',
            'password',
            '',
            'Please click your avatar on the left sidebar in Canvas and then click "Settings." \nIn the page you are redirected to, please scroll down until you see a "New Access Token" button in a section named "Approved Integrations." \nPlease click that button and follow the instruction to create a new access token, copy it, and then paste it here. \nExample: 1081~prKixoT8pyE04DPBIgmTod2IhyVTNUj7aVhazDI3UKbwt314ha31c6YXgxCpnOxH'
        )
    };

    static CREDENTIALS_ID_LIST: CanvasCredentialAttributes[] = ['canvasURL', 'canvasAccessToken'];

    async ngAfterViewInit() {
        if (!this.retrieveCredentialModalTemplate) return;
        if (!this.storageManagerService.hasCredentials()) return;
        if (isDevMode()) {
            const password = localStorage.getItem('password');
            if (password != null) {
                this.credentials = await this.storageManagerService.retrieveCredentials(password);
                await this.onSubmitCredential();
                return;
            }
        }
        this.password = '';
        this.retrieveCredentialModalRef = this.modalService.show(this.retrieveCredentialModalTemplate, {
            backdrop: 'static',
            keyboard: false
        });
    }

    async onDeleteCredentials(): Promise<void> {
        this.isProcessing = true;
        const [modalRef, result] = await this.modalManagerService.createConfirmationModal(
            'Do you really want to delete saved credentials?',
            'Confirmation',
            true
        );
        if (!result) {
            modalRef.hide();
            this.isProcessing = false;
            return;
        }
        this.storageManagerService.clearCredentials();
        modalRef.hide();
        this.retrieveCredentialModalRef?.hide();
        this.isProcessing = false;
    }

    async onLoadCredentials(autoLogin = false): Promise<void> {
        this.loadCredentialErrorMessage = undefined;
        this.isProcessing = true;
        try {
            this.credentials = await this.storageManagerService.retrieveCredentials(this.password);
        } catch (err: unknown) {
            this.loadCredentialErrorMessage =
                'Load credentials failed. The password might be wrong, or the saved credentials might have broken.';
            this.isProcessing = false;
            return;
        }
        if (autoLogin) await this.onSubmitCredential();
        this.retrieveCredentialModalRef?.hide();
        this.isProcessing = false;
    }

    getPasswordFormItemInfo() {
        return new FormItemInfo('password', 'Password', 'password');
    }

    openLink() {
        window.open('https://docs.google.com/document/d/1H4cvBXV7wwVp1IA2squ0mtrug5HkDVlBf4qKhh1o_vQ/view', '_blank');
    }

    getCredentialsFormItemInfoMap(): CanvasCredentialFormItemInfoMap {
        return LoginComponent.CANVAS_CREDENTIAL_FORM_ITEM_INFO_MAP;
    }

    getCredentialIDList(): CanvasCredentialAttributes[] {
        return LoginComponent.CREDENTIALS_ID_LIST;
    }

    hasExistingCredentials(): boolean {
        return this.storageManagerService.hasCredentials();
    }

    async onClickSubmitButton(): Promise<void> {
        if (!this.storeCredentialModalTemplate) throw new Error('Store Credential Modal is not available');
        if (this.isSavingCredentials) {
            this.password = '';
            this.storeCredentialModalRef = this.modalService.show(this.storeCredentialModalTemplate, {
                backdrop: 'static',
                keyboard: false
            });
            return;
        }
        this.isProcessing = true;
        await this.onSubmitCredential();
        this.isProcessing = false;
    }

    async onSaveCredentials(): Promise<void> {
        this.isProcessing = true;
        await this.storageManagerService.storeCredentials(this.credentials, this.password);
        await this.onSubmitCredential();
        this.storeCredentialModalRef?.hide();
        this.isProcessing = false;
    }

    private sanitizeAndParseURL(url: string) {
        const sanitized = this.sanitizer.sanitize(SecurityContext.URL, url);
        if (sanitized == null || sanitized.startsWith('unsafe:')) {
            throw new Error(`Provided Canvas URL (${url}) can’t be sanitized.`);
        }
        // TODO: handle protocol-less inputs.
        //       i.e., 'localhost:23457' or 'canvas.instructure.com'
        const parsedURL = new URL(sanitized);
        // Force HTTPS protocol
        parsedURL.protocol = 'https:';
        return parsedURL.origin;
        // Based on: https://github.com/instructure/canvas-lms/issues/660
        // Canvas is only hosted at a URL origin.
    }

    async onSubmitCredential(): Promise<void> {
        try {
            this.credentials.canvas.canvasURL = this.sanitizeAndParseURL(this.credentials.canvas.canvasURL);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            await this.modalManagerService.createNotificationModal(
                ErrorSerializer.serailize(error),
                'Canvas URL Error'
            );
            return;
        }
        const canvasCredentialValidation = await this.canvasService.configureCredential(this.credentials.canvas);
        const validationResult = (await this.credentialManagerService.validate(this.credentials)).filter(
            (x) => x[2] !== undefined
        );
        if (canvasCredentialValidation === undefined && validationResult.length == 0) {
            await this.credentialManagerService.configure(this.credentials);
            this.credentials = {
                canvas: {
                    canvasURL: '',
                    canvasAccessToken: ''
                }
            };
            this.router.navigate(['/select-course']);
            return;
        } else {
            const errMsgs: string[] = [];
            if (canvasCredentialValidation != undefined) {
                errMsgs.push(
                    `CANVAS\nToken ATM couldn’t verify your credentials at: \n${this.credentials.canvas.canvasURL}\nDouble check that you are providing the correct Canvas URL and Access Token.\n`
                );
                errMsgs.push('Error Message:' + ErrorSerializer.serailize(canvasCredentialValidation));
            }

            for (const [key, credential, err] of validationResult) {
                if (credential === undefined) continue;
                if (errMsgs.length != 0) errMsgs.push('\n--------------------\n');
                errMsgs.push(this.credentialManagerService.getHandler(key).generateErrorMessage(credential));
                errMsgs.push('Error Message:' + ErrorSerializer.serailize(err));
            }

            this.credentialManagerService.clear();

            await this.modalManagerService.createNotificationModal(
                errMsgs.join('\n'),
                `Credential ${pluralize('Error', errMsgs.length / 2)}`
            );
        }
    }

    get optionalCredentials(): [string, string][] {
        return this.credentialManagerService.getHandlers().map((x) => [x.key, x.descriptiveName]);
    }

    onConfigureCredential(credential: string) {
        const modalRef = this.modalService.show(OptionalCredentialManagementComponent, {
            initialState: {
                handler: this.credentialManagerService.getHandler(credential),
                credentials: this.credentials
            },
            class: 'modal-lg',
            backdrop: 'static',
            keyboard: false
        });
        if (modalRef.content) modalRef.content.modalRef = modalRef;
    }

    isCredentialStored(credential: string): boolean {
        return this.credentialManagerService.hasCredential(this.credentials, credential);
    }
}
