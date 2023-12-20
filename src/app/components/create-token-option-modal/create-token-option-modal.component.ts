import { Component, Inject, Input } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { TokenOptionRegistry } from 'app/token-options/token-option-registry';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TokenOptionManagementComponent } from '../token-option-management/token-option-management.component';
import { CredentialManagerService } from 'app/services/credential-manager.service';
import { ModalManagerService } from 'app/services/modal-manager.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-create-token-option-modal',
    templateUrl: './create-token-option-modal.component.html',
    styleUrls: ['./create-token-option-modal.component.sass']
})
export class CreateTokenOptionModalComponent {
    @Input() group?: TokenOptionGroup;
    modalRef?: BsModalRef<unknown>;
    isProcessing = false;

    constructor(
        @Inject(TokenOptionRegistry) private tokenOptionRegistry: TokenOptionRegistry,
        @Inject(BsModalService) private modalService: BsModalService,
        @Inject(CredentialManagerService) private credentialManagerService: CredentialManagerService,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService,
        @Inject(Router) private router: Router
    ) {}

    selectedOption = this.options[0]?.[0];

    get options(): [string, string][] {
        return this.tokenOptionRegistry.getRegisteredTokenOptionsDescriptiveNames();
    }

    async onNextStep(): Promise<void> {
        if (!this.group || !this.selectedOption) return;
        const tokenOptionClass = this.tokenOptionRegistry.getTokenOptionClass(this.selectedOption);
        if (!tokenOptionClass) return;
        this.isProcessing = true;
        const missingCredentials =
            this.credentialManagerService.getMissingCredentialsDescriptionByClass(tokenOptionClass);
        if (missingCredentials.size != 0) {
            const result = await this.modalManagerService.createMultipleChoiceModalWithoutRef(
                `<p>This type of token option cannot be created successfully until credentials for the following services are provided: <b>${[
                    ...missingCredentials
                ].join(
                    ','
                )}.</b></p><p>You can go back to the login screen now to provide these credentials.</p><p>You can also choose to start creating this token option anyway, but please be aware that <b>it will definitely fail, while no change could be saved!<b></p>`,
                [
                    {
                        key: 'cancel',
                        name: 'Cancel',
                        bsColor: 'outline-secondary'
                    },
                    {
                        key: 'login',
                        name: 'Back to Login',
                        bsColor: 'primary'
                    },
                    {
                        key: 'create',
                        name: 'Create Anyway',
                        bsColor: 'danger'
                    }
                ],
                {
                    key: 'cancel',
                    name: 'Cancel'
                },
                'Missing Credentials'
            );
            switch (result) {
                case 'login': {
                    this.credentialManagerService.clear();
                    const onHiddenPromise = this.modalRef?.onHidden
                        ? firstValueFrom(this.modalRef.onHidden)
                        : undefined;
                    this.modalRef?.hide();
                    if (onHiddenPromise) await onHiddenPromise;
                    this.router.navigate(['/login']);
                    return;
                }
                case 'cancel': {
                    this.isProcessing = false;
                    return;
                }
            }
        }
        const modalRef = this.modalService.show(TokenOptionManagementComponent, {
            initialState: {
                tokenOptionType: this.selectedOption,
                value: this.group
            },
            class: 'modal-lg',
            backdrop: 'static',
            keyboard: false
        });
        if (modalRef.content) modalRef.content.modalRef = modalRef;
        this.isProcessing = false;
        this.modalRef?.hide();
    }
}
