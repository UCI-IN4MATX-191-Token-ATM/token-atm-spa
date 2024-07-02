import { Component, EnvironmentInjector, Inject, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { CredentialManagerService } from 'app/services/credential-manager.service';
import { ModalManagerService } from 'app/services/modal-manager.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import { TokenOptionFieldComponentFactoryRegistry } from 'app/token-options/token-option-field-component-factory-registry';
import { TokenOptionResolverRegistry } from 'app/token-options/token-option-resolver-registry';
import type { TokenOption } from 'app/token-options/token-option';
import { TokenOptionRegistry } from 'app/token-options/token-option-registry';
import type { FormField } from 'app/utils/form-field/form-field';
import { actionNeededTemplate } from 'app/utils/string-templates';
import type { BsModalRef } from 'ngx-bootstrap/modal';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-token-option-management',
    templateUrl: './token-option-management.component.html',
    styleUrls: ['./token-option-management.component.sass']
})
export class TokenOptionManagementComponent implements OnInit {
    @Input() tokenOptionType?: string;
    @Input() value?: TokenOptionGroup | TokenOption;
    @ViewChild('tokenOptionField', { read: ViewContainerRef, static: true }) tokenOptionContainer?: ViewContainerRef;

    modalRef?: BsModalRef<unknown>;
    typeName = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private field?: FormField<TokenOptionGroup | TokenOption, unknown, any>;

    private _isReadOnly = true;
    private _isProcessing = false;

    constructor(
        @Inject(TokenATMConfigurationManagerService)
        private configurationManagerService: TokenATMConfigurationManagerService,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService,
        @Inject(TokenOptionFieldComponentFactoryRegistry)
        private componentFactoryRegistry: TokenOptionFieldComponentFactoryRegistry,
        @Inject(TokenOptionRegistry) private tokenOptionRegistry: TokenOptionRegistry,
        @Inject(TokenOptionResolverRegistry) private tokenOptionResolverRegistry: TokenOptionResolverRegistry,
        @Inject(EnvironmentInjector) private environmentInjector: EnvironmentInjector,
        @Inject(CredentialManagerService) private credentialManagerService: CredentialManagerService,
        @Inject(Router) private router: Router
    ) {}

    ngOnInit() {
        if (
            !this.tokenOptionType ||
            !this.value ||
            !this.tokenOptionContainer ||
            this.tokenOptionRegistry.getDescriptiveName(this.tokenOptionType) == undefined
        )
            throw new Error('Failed to initialize token option management modal');
        this.typeName = this.tokenOptionRegistry.getDescriptiveName(this.tokenOptionType) as string;
        const result = this.componentFactoryRegistry.createTokenOptionFieldComponent(
            this.tokenOptionType,
            this.environmentInjector
        );
        if (result == undefined)
            throw new Error('Failed to intialize token option management modal: Unsupported token option type');
        const [renderer, field] = result;
        this.field = field;
        this.field.srcValue = this.value;
        this.isReadOnly = this.isEditing ? !(this.value as TokenOption).isMigrating : false;
        renderer(this.tokenOptionContainer);
    }

    set isReadOnly(isReadOnly: boolean) {
        this._isReadOnly = isReadOnly;
        if (this.field) this.field.isReadOnly = isReadOnly || this.isProcessing;
    }

    get isReadOnly(): boolean {
        return this._isReadOnly;
    }

    set isProcessing(isProcessing: boolean) {
        this._isProcessing = isProcessing;
        if (this.field) this.field.isReadOnly = this.isReadOnly || isProcessing;
    }

    get isProcessing(): boolean {
        return this._isProcessing;
    }

    get isMissingCredentials(): boolean {
        if (!this.tokenOptionType) return false;
        const tokenOptionClass = this.tokenOptionRegistry.getTokenOptionClass(this.tokenOptionType);
        if (!tokenOptionClass) return false;
        return this.credentialManagerService.hasMissingCredentialsByClass(tokenOptionClass);
    }

    async onEdit(): Promise<void> {
        if (!this.field || !this.tokenOptionType) return;
        const tokenOptionClass = this.tokenOptionRegistry.getTokenOptionClass(this.tokenOptionType);
        if (!tokenOptionClass) return;
        this.isProcessing = true;
        const missingCredentials =
            this.credentialManagerService.getMissingCredentialsDescriptionByClass(tokenOptionClass);
        if (missingCredentials.size == 0) {
            this.isProcessing = false;
            this.isReadOnly = false;
            this.field.isReadOnly = false;
            return;
        }
        const result = await this.modalManagerService.createMultipleChoiceModalWithoutRef(
            `<p>This token option cannot be edited successfully until credentials for the following services are provided: <b>${[
                ...missingCredentials
            ].join(
                ','
            )}.</b></p><p>You can go back to the login screen now to provide these credentials.</p><p>You can also choose to enter the editing mode anyway, but please be aware that <b>no change could be saved!<b></p>`,
            [
                {
                    name: 'Cancel',
                    bsColor: 'outline-secondary'
                },
                {
                    key: 'login',
                    name: 'Back to Login',
                    bsColor: 'primary'
                },
                {
                    key: 'edit',
                    name: 'Edit Anyway',
                    bsColor: 'danger'
                }
            ],
            {
                name: 'Cancel'
            },
            'Missing Credentials'
        );
        switch (result) {
            case 'login': {
                this.credentialManagerService.clear();
                const onHideenPromise = this.modalRef?.onHidden ? firstValueFrom(this.modalRef.onHidden) : undefined;
                this.modalRef?.hide();
                if (onHideenPromise) await onHideenPromise;
                this.router.navigate(['/login']);
                break;
            }
            case 'edit': {
                this.isReadOnly = false;
                this.field.isReadOnly = false;
                break;
            }
        }
        this.isProcessing = false;
    }

    async onCreate(): Promise<void> {
        if (!this.field || this.isEditing) return;
        this.isProcessing = true;
        if (!(await this.field.validate())) {
            this.isProcessing = false;
            return;
        }
        const group = this.value as TokenOptionGroup;
        const tokenOption = this.tokenOptionResolverRegistry.constructTokenOption(
            group,
            await this.field.destValue,
            true
        );
        group.addTokenOption(tokenOption);
        const result = await this.configurationManagerService.updateTokenOptionGroup(group);
        if (!result) await this.notifyUpdateFailure();
        this.isProcessing = false;
        this.modalRef?.hide();
    }

    async onSave(): Promise<void> {
        if (!this.field || !this.isEditing) return;
        this.isProcessing = true;
        if (!(await this.field.validate())) {
            this.isProcessing = false;
            return;
        }
        const tokenOption = (this.value as TokenOption).fromData(await this.field.destValue, true);
        if (tokenOption.isMigrating) tokenOption.isMigrating = false;
        const result = await this.configurationManagerService.updateTokenOptionGroup(tokenOption.group);
        if (!result) await this.notifyUpdateFailure();
        this.isProcessing = false;
        this.modalRef?.hide();
    }

    private async notifyUpdateFailure(): Promise<void> {
        await this.modalManagerService.createNotificationModal(
            // TODO: Add direct link to the Quiz needing "Save It Now"
            actionNeededTemplate(
                'Auto update failed. \nSome students have already taken the quiz that corresponds to the token option group that this token option belongs to. \n\nPlease click the "Save It Now" button in the quiz management page on Canvas to manually update.'
            )
        );
    }

    async onDelete(): Promise<void> {
        if (!this.field || !this.isEditing) return;
        this.isProcessing = true;
        const option = this.value as TokenOption;
        const [confirmationRef, result] = await this.modalManagerService.createConfirmationModal(
            `Do you really want to delete the token option '${option.name}'?`,
            'Confirmation',
            true
        );
        if (!result) {
            confirmationRef.hide();
            this.isProcessing = false;
            return;
        }
        if (confirmationRef.content) confirmationRef.content.disableButton = true;
        const group = option.group;
        group.deleteTokenOption(option);
        const updateResult = await this.configurationManagerService.updateTokenOptionGroup(group);
        if (!updateResult) await this.notifyUpdateFailure();
        confirmationRef.hide();
        this.isProcessing = false;
        this.modalRef?.hide();
    }

    get isEditing(): boolean {
        return !(this.value instanceof TokenOptionGroup);
    }
}
