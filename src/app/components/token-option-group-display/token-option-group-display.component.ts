import { Component, Inject, Input } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { ModalManagerService } from 'app/services/modal-manager.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { CreateTokenOptionModalComponent } from '../create-token-option-modal/create-token-option-modal.component';
import { TokenOptionGroupManagementComponent } from '../token-option-group-management/token-option-group-management.component';
import { ExportRequestModalComponent } from '../export-request-modal/export-request-modal.component';

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
                value: this.group
            }
        });
        if (modalRef.content) modalRef.content.modalRef = modalRef;
    }

    async onCreateTokenOption(): Promise<void> {
        if (!this.group) return;
        const modalRef = this.modalService.show(CreateTokenOptionModalComponent, {
            initialState: {
                group: this.group
            }
        });
        if (modalRef.content) modalRef.content.modalRef = modalRef;
    }

    async onPublishGroup(): Promise<void> {
        if (!this.group) return;
        const [modalRef, result] = await this.modalManagerService.createConfirmationModal(
            `Do you really want to publish the token option group '${this.group.name}'?`
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
            `Do you really want to unpublish the token option group '${this.group.name}'?`
        );
        if (!result) {
            modalRef.hide();
            return;
        }
        if (modalRef.content) modalRef.content.disableButton = true;
        const unpublishRresult = await this.configurationManagerService.unpublishTokenOptionGroup(this.group);
        if (!unpublishRresult) {
            await this.modalManagerService.createNotificationModal(
                `Unpublishing token option group '${this.group.name}' failed. \nSome students have already taken the Canvas quiz for this token option group.`,
                'Error'
            );
        }
        modalRef.hide();
    }

    async onDeleteGroup(): Promise<void> {
        if (!this.group) return;
        const [modalRef, result] = await this.modalManagerService.createConfirmationModal(
            `Do you really want to delete the token option group '${this.group.name}'?`,
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

    get tokenOptionGroupMaxSize() {
        return TokenOptionGroup.TOKEN_OPTION_GROUP_MAX_SIZE;
    }

    onExportProcessedRequests(): void {
        if (!this.group) return;
        const group = this.group;
        const modalRef = this.modalService.show(ExportRequestModalComponent, {
            initialState: {
                configuration: group.configuration,
                filter: async (request) => request.tokenOptionGroupId == group.id,
                titleSuffix: `Token Option Group (${group.name})`
            },
            class: 'modal-lg',
            backdrop: 'static',
            keyboard: false
        });
        if (modalRef.content) modalRef.content.modalRef = modalRef;
    }
}
