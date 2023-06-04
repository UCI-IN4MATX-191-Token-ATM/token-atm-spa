import { Component, Inject, Input } from '@angular/core';
import type { TokenOption } from 'app/token-options/token-option';
import { TokenOptionRegistry } from 'app/token-options/token-option-registry';
import { BsModalService } from 'ngx-bootstrap/modal';
import { TokenOptionFieldRegistry } from '../form-fields/token-option-fields/token-option-field-registry';
import { TokenOptionManagementComponent } from '../token-option-management/token-option-management.component';

@Component({
    selector: 'app-token-option-display',
    templateUrl: './token-option-display.component.html',
    styleUrls: ['./token-option-display.component.sass']
})
export class TokenOptionDisplayComponent {
    @Input() option?: TokenOption;

    constructor(
        @Inject(BsModalService) private modalService: BsModalService,
        @Inject(TokenOptionFieldRegistry) private fieldRegistry: TokenOptionFieldRegistry,
        @Inject(TokenOptionRegistry) private tokenOptionRegistry: TokenOptionRegistry
    ) {}

    getAbsValue(value: number): number {
        return Math.abs(value);
    }

    onViewTokenOption() {
        if (!this.option) return;
        const componentType = this.fieldRegistry.getComponentType(this.option.type);
        const typeName = this.tokenOptionRegistry.getDescriptiveName(this.option.type);
        if (!componentType || typeName == undefined) return;
        const modalRef = this.modalService.show(TokenOptionManagementComponent, {
            initialState: {
                optionComponentType: componentType,
                value: this.option,
                typeName: typeName
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
}
