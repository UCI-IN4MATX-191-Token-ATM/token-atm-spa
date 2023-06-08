import { Component, Inject, Input } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { ModalManagerService } from 'app/services/modal-manager.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { TokenOptionGroupManagementComponent } from '../token-option-group-management/token-option-group-management.component';

@Component({
    selector: 'app-token-option-group-display',
    templateUrl: './token-option-group-display.component.html',
    styleUrls: ['./token-option-group-display.component.sass']
})
export class TokenOptionGroupDisplayComponent {
    @Input() group?: TokenOptionGroup;
    isCollapsed = false;
    hovering = false;

    constructor(
        @Inject(BsModalService) private modalService: BsModalService,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService,
        @Inject(TokenATMConfigurationManagerService)
        private configurationManagerService: TokenATMConfigurationManagerService
    ) {}

    onEditGroup(): void {
        if (!this.group) return;
        const modalRef = this.modalService.show(TokenOptionGroupManagementComponent, {
            initialState: {
                group: this.group
            }
        });
        if (modalRef.content) modalRef.content.modalRef = modalRef;
    }

    async onPublishGroup(): Promise<void> {
        if (!this.group) return;
        const [modalRef, result] = await this.modalManagerService.createConfirmationModal(
            `Do you really want to publish token option group ${this.group.name}?`
        );
        if (!result) {
            modalRef.hide();
            return;
        }
        if (modalRef.content) modalRef.content.disableButton = true;
        await this.configurationManagerService.publishTokenOptionGroup(this.group);
        modalRef.hide();
    }

    async onUnpublishGroup(): Promise<void> {
        if (!this.group) return;
        const [modalRef, result] = await this.modalManagerService.createConfirmationModal(
            `Do you really want to unpublish token option group ${this.group.name}?`
        );
        if (!result) {
            modalRef.hide();
            return;
        }
        if (modalRef.content) modalRef.content.disableButton = true;
        const unpublishRresult = await this.configurationManagerService.unpublishTokenOptionGroup(this.group);
        if (!unpublishRresult) {
            await this.modalManagerService.createNotificationModal(
                `Unpublish token option group ${this.group.name} failed. Some students have already taken the quiz for this token option group`,
                'Error'
            );
        }
        modalRef.hide();
    }

    async onDeleteGroup(): Promise<void> {
        if (!this.group) return;
        const [modalRef, result] = await this.modalManagerService.createConfirmationModal(
            `Do you really want to delete token option group ${this.group.name}?`,
            'Confirmation',
            true
        );
        if (!result) {
            modalRef.hide();
            return;
        }
        if (modalRef.content) modalRef.content.disableButton = true;
        await this.configurationManagerService.deleteTokenOptionGroup(this.group);
        modalRef.hide();
    }
}
