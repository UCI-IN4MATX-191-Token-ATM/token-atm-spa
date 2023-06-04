import { Component, Inject, Input } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { TokenOptionRegistry } from 'app/token-options/token-option-registry';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TokenOptionFieldRegistry } from '../form-fields/token-option-fields/token-option-field-registry';
import { TokenOptionManagementComponent } from '../token-option-management/token-option-management.component';

@Component({
    selector: 'app-create-token-option-modal',
    templateUrl: './create-token-option-modal.component.html',
    styleUrls: ['./create-token-option-modal.component.sass']
})
export class CreateTokenOptionModalComponent {
    @Input() group?: TokenOptionGroup;
    modalRef?: BsModalRef<unknown>;

    constructor(
        @Inject(TokenOptionRegistry) private tokenOptionRegistry: TokenOptionRegistry,
        @Inject(TokenOptionFieldRegistry) private tokenOptionFieldRegistry: TokenOptionFieldRegistry,
        @Inject(BsModalService) private modalService: BsModalService
    ) {}

    selectedOption = this.options[0]?.[0];

    get options(): [string, string][] {
        return this.tokenOptionRegistry.getRegisteredTokenOptionsDescriptiveNames();
    }

    onNextStep(): void {
        if (!this.group || !this.selectedOption) return;
        const componentType = this.tokenOptionFieldRegistry.getComponentType(this.selectedOption);
        const typeName = this.tokenOptionRegistry.getDescriptiveName(this.selectedOption);
        if (!componentType || !typeName) return;
        const modalRef = this.modalService.show(TokenOptionManagementComponent, {
            initialState: {
                optionComponentType: componentType,
                value: this.group,
                typeName: typeName
            },
            class: 'modal-lg',
            backdrop: 'static',
            keyboard: false
        });
        if (modalRef.content) modalRef.content.modalRef = modalRef;
        this.modalRef?.hide();
    }
}
