import { Component, ComponentRef, Inject, Input, Type, ViewChild, ViewContainerRef } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { ModalManagerService } from 'app/services/modal-manager.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import { TokenOption } from 'app/token-options/token-option';
import type { BsModalRef } from 'ngx-bootstrap/modal';
import type { TokenOptionField } from '../form-fields/token-option-fields/token-option-field';

@Component({
    selector: 'app-token-option-management',
    templateUrl: './token-option-management.component.html',
    styleUrls: ['./token-option-management.component.sass']
})
export class TokenOptionManagementComponent {
    @Input() typeName = '';
    @ViewChild('tokenOptionField', { read: ViewContainerRef, static: false }) set tokenOptionContainer(
        tokenOptionContainer: ViewContainerRef
    ) {
        this._tokenOptionContainer = tokenOptionContainer;
        this.initialize();
    }

    modalRef?: BsModalRef<unknown>;
    componentRef?: ComponentRef<TokenOptionField>;

    @Input() set optionComponentType(optionComponentType: Type<TokenOptionField>) {
        this._optionComponentType = optionComponentType;
        this.initialize();
    }

    @Input() set value(value: TokenOptionGroup | TokenOption) {
        this._value = value;
        this.initialize();
    }

    isReadOnly = true;
    isProcessing = false;
    private _tokenOptionContainer?: ViewContainerRef;
    private _optionComponentType?: Type<TokenOptionField>;
    private _value?: TokenOptionGroup | TokenOption;

    constructor(
        @Inject(TokenATMConfigurationManagerService)
        private configurationManagerService: TokenATMConfigurationManagerService,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService
    ) {}

    private initialize() {
        if (!this._tokenOptionContainer || !this._optionComponentType || !this._value) return;
        if (!this.componentRef)
            this.componentRef = this._tokenOptionContainer.createComponent(this._optionComponentType);
        this.isReadOnly = this.isEditing;
        const instance = this.componentRef.instance;
        instance.isReadOnly = this.isEditing;
        instance.initValue = this._value;
    }

    onEdit(): void {
        if (!this.componentRef) return;
        this.isReadOnly = false;
        this.componentRef.instance.isReadOnly = false;
    }

    async onCreate(): Promise<void> {
        if (!this.componentRef || this.isEditing) return;
        this.isProcessing = true;
        if (!(await this.componentRef.instance.validate())) {
            this.isProcessing = false;
            return;
        }
        const tokenOption = await this.componentRef.instance.getValue();
        const group = this._value as TokenOptionGroup;
        group.addTokenOption(tokenOption);
        await this.configurationManagerService.updateTokenOptionGroup(group);
        this.isProcessing = false;
        this.modalRef?.hide();
    }

    async onSave(): Promise<void> {
        if (!this.componentRef || !this.isEditing) return;
        this.isProcessing = true;
        if (!(await this.componentRef.instance.validate())) {
            this.isProcessing = false;
            return;
        }
        const tokenOption = await this.componentRef.instance.getValue();
        await this.configurationManagerService.updateTokenOptionGroup(tokenOption.group);
        this.isProcessing = false;
        this.modalRef?.hide();
    }

    async onDelete(): Promise<void> {
        if (!this.componentRef || !this.isEditing) return;
        this.isProcessing = true;
        const option = this._value as TokenOption;
        const [confirmationRef, result] = await this.modalManagerService.createConfirmationModal(
            `Do you really want to delete token option ${option.name}?`
        );
        if (!result) {
            confirmationRef.hide();
            this.isProcessing = false;
            return;
        }
        if (confirmationRef.content) confirmationRef.content.disableButton = true;
        const group = option.group;
        group.deleteTokenOption(option);
        await this.configurationManagerService.updateTokenOptionGroup(group);
        confirmationRef.hide();
        this.isProcessing = false;
        this.modalRef?.hide();
    }

    get isEditing(): boolean {
        return this._value instanceof TokenOption;
    }
}
