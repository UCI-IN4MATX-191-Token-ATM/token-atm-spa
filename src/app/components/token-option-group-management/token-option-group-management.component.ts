import { Component, Inject, Input, ViewChild } from '@angular/core';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { BsModalRef } from 'ngx-bootstrap/modal';
import type { StringInputFieldComponent } from '../form-fields/string-input-field/string-input-field.component';
import type { StringTextareaFieldComponent } from '../form-fields/string-textarea-field/string-textarea-field.component';

@Component({
    selector: 'app-token-option-group-management',
    templateUrl: './token-option-group-management.component.html',
    styleUrls: ['./token-option-group-management.component.sass']
})
export class TokenOptionGroupManagementComponent {
    _configuration?: TokenATMConfiguration;
    _group?: TokenOptionGroup;
    groupId = -1;
    groupName = '';
    groupDescription = '';
    groupNameValidator = async (v: string) => (v.length > 0 ? undefined : 'Name cannot be empty');
    modalRef?: BsModalRef<unknown>;
    isProcessing = false;

    @ViewChild('groupNameComp') groupNameCompRef?: StringInputFieldComponent;
    @ViewChild('groupDescriptionComp') groupDescriptionCompRef?: StringTextareaFieldComponent;

    constructor(
        @Inject(TokenATMConfigurationManagerService) private managerService: TokenATMConfigurationManagerService
    ) {}

    @Input() set group(group: TokenOptionGroup) {
        this._group = group;
        this.groupId = this._group.id;
        this.groupName = this._group.name;
        this.groupDescription = this._group.description;
    }

    @Input() set configuration(configuration: TokenATMConfiguration) {
        this._configuration = configuration;
        this.groupId = this._configuration.nextFreeTokenOptionGroupId;
    }

    get isEditing(): boolean {
        return this._group != undefined;
    }

    private async getValue(): Promise<[string, string] | undefined> {
        if (!this.groupNameCompRef || !this.groupDescriptionCompRef) return undefined;
        let result = true;
        result &&= await this.groupNameCompRef.validate();
        result &&= await this.groupDescriptionCompRef.validate();
        return result
            ? [await this.groupNameCompRef.getValue(), await this.groupDescriptionCompRef.getValue()]
            : undefined;
    }

    async onSave(): Promise<void> {
        if (!this._group) return;
        this.isProcessing = true;
        const result = await this.getValue();
        if (result == undefined) {
            this.isProcessing = false;
            return;
        }
        [this._group.name, this._group.description] = result;
        await this.managerService.updateTokenOptionGroupMetadata(this._group);
        this.isProcessing = false;
        this.modalRef?.hide();
    }

    async onCreate(): Promise<void> {
        if (!this._configuration || !this.groupNameCompRef || !this.groupDescriptionCompRef) return;
        this.isProcessing = true;
        const result = await this.getValue();
        if (result == undefined) {
            this.isProcessing = false;
            return;
        }
        const [name, description] = result;
        await this.managerService.addNewTokenOptionGroup(
            new TokenOptionGroup(this._configuration, name, this.groupId, '', description, false, [])
        );
        this.isProcessing = false;
        this.modalRef?.hide();
    }
}
