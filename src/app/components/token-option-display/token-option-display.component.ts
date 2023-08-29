import { Component, Inject, Input } from '@angular/core';
import { ModalManagerService } from 'app/services/modal-manager.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { TokenOption } from 'app/token-options/token-option';
import { TokenOptionRegistry } from 'app/token-options/token-option-registry';
import { BsModalService } from 'ngx-bootstrap/modal';
import { MoveTokenOptionModalComponent } from '../move-token-option-modal/move-token-option-modal.component';
import { TokenOptionManagementComponent } from '../token-option-management/token-option-management.component';
import { actionNeededTemplate } from 'app/utils/string-templates';

@Component({
    selector: 'app-token-option-display',
    templateUrl: './token-option-display.component.html',
    styleUrls: ['./token-option-display.component.sass']
})
export class TokenOptionDisplayComponent {
    hoverFocus = false;
    @Input() option?: TokenOption;

    constructor(
        @Inject(BsModalService) private modalService: BsModalService,
        @Inject(TokenOptionRegistry) private tokenOptionRegistry: TokenOptionRegistry,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService,
        @Inject(TokenATMConfigurationManagerService)
        private configurationManagerService: TokenATMConfigurationManagerService
    ) {}

    getAbsValue(value: number): number {
        return Math.abs(value);
    }

    onViewTokenOption() {
        if (!this.option) return;
        const modalRef = this.modalService.show(TokenOptionManagementComponent, {
            initialState: {
                tokenOptionType: this.option.type,
                value: this.option
            },
            class: 'modal-lg',
            backdrop: 'static',
            keyboard: false
        });
        if (modalRef.content) modalRef.content.modalRef = modalRef;
    }

    get descriptiveName(): string | undefined {
        if (!this.option) return undefined;
        return this.tokenOptionRegistry.getDescriptiveName(this.option.type);
    }

    async onMove(): Promise<void> {
        if (!this.option) return;
        const modalRef = this.modalService.show(MoveTokenOptionModalComponent, {
            initialState: {
                configuration: this.option.group.configuration,
                srcOption: this.option
            },
            backdrop: 'static',
            keyboard: false
        });
        if (modalRef.content) modalRef.content.modalRef = modalRef;
    }

    async onDelete(): Promise<void> {
        if (!this.option) return;
        const [confirmationRef, result] = await this.modalManagerService.createConfirmationModal(
            `Do you really want to delete the token option '${this.option.name}'?`,
            'Confirmation',
            true
        );
        if (!result) {
            confirmationRef.hide();
            return;
        }
        if (confirmationRef.content) confirmationRef.content.disableButton = true;
        const group = this.option.group;
        group.deleteTokenOption(this.option);
        const updateResult = await this.configurationManagerService.updateTokenOptionGroup(group);
        if (!updateResult)
            await this.modalManagerService.createNotificationModal(
                // TODO: Add direct link to the Quiz needing "Save It Now"
                actionNeededTemplate(
                    'Auto update failed. \nSome students have already taken the Canvas quiz that corresponds to the token option group that this token option belongs to. \n\nPlease click the "Save It Now" button in the quiz management page on Canvas to manually update.'
                )
            );
        confirmationRef.hide();
    }
}
