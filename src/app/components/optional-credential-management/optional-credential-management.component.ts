import { Component, EnvironmentInjector, Inject, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import type { TokenATMCredentials } from 'app/data/token-atm-credentials';
import type { CredentialHandler } from 'app/services/credential-manager.service';
import { ModalManagerService } from 'app/services/modal-manager.service';
import type { FormField } from 'app/utils/form-field/form-field';
import type { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-optional-credential-management',
    templateUrl: './optional-credential-management.component.html',
    styleUrls: ['./optional-credential-management.component.sass']
})
export class OptionalCredentialManagementComponent<K extends object> implements OnInit {
    @Input() handler?: CredentialHandler<K>;
    @Input() credentials?: TokenATMCredentials;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field?: FormField<K, K, any>;
    private _isProcessing = false;
    @Input() modalRef?: BsModalRef<unknown>;
    @ViewChild('credentialField', { static: true, read: ViewContainerRef }) credentialFieldContainer?: ViewContainerRef;

    constructor(
        @Inject(EnvironmentInjector) private environmentInjector: EnvironmentInjector,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService
    ) {}

    get credentialDescriptiveName(): string {
        return this.handler?.descriptiveName ?? '';
    }

    get isEditing(): boolean {
        if (!this.handler || !this.credentials) return false;
        return this.handler.has(this.credentials);
    }

    set isProcessing(isProcessing: boolean) {
        this._isProcessing = isProcessing;
        if (this.field) this.field.isReadOnly = isProcessing;
    }

    get isProcessing(): boolean {
        return this._isProcessing;
    }

    ngOnInit(): void {
        if (!this.handler || !this.credentials || !this.credentialFieldContainer)
            throw new Error('Failed to initialize optional credential management modal');
        const [renderer, field] = this.handler.buildFormFieldComponent(this.environmentInjector);
        this.field = field;
        const value = this.handler.get(this.credentials);
        if (value) this.field.srcValue = value;
        renderer(this.credentialFieldContainer);
    }

    async onDelete() {
        if (!this.handler || !this.credentials) return;
        this.isProcessing = true;
        const [modalRef, result] = await this.modalManagerService.createConfirmationModal(
            `Do you really want to delete credential for ${this.credentialDescriptiveName}?`,
            'Confirmation',
            true
        );
        if (!result) {
            modalRef.hide();
            this.isProcessing = false;
            return;
        }
        this.handler.delete(this.credentials);
        modalRef.hide();
        this.isProcessing = false;
        this.modalRef?.hide();
        return;
    }

    async onConfigure() {
        if (!this.field || !this.handler || !this.credentials) return;
        this.isProcessing = true;
        if (!(await this.field.validate())) {
            this.isProcessing = false;
            return;
        }
        this.handler.set(this.credentials, await this.field.destValue);
        this.isProcessing = false;
        this.modalRef?.hide();
    }

    onHelp() {
        if (!this.handler) return;
        window.open(this.handler.documentLink, '_blank');
    }
}
