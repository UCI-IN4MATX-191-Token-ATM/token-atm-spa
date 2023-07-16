import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import type { StringInputFieldComponent } from '../form-fields/string-input-field/string-input-field.component';
import type { StringTextareaFieldComponent } from '../form-fields/string-textarea-field/string-textarea-field.component';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { BsModalRef } from 'ngx-bootstrap/modal';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';

@Component({
    selector: 'app-edit-configuration-modal',
    templateUrl: './edit-configuration-modal.component.html',
    styleUrls: ['./edit-configuration-modal.component.sass']
})
export class EditConfigurationModalComponent implements OnInit {
    isProcessing = true;
    @Input() modalRef?: BsModalRef<unknown>;
    @Input() configuration?: TokenATMConfiguration;

    @ViewChild('suffixFieldComponent', { static: true }) private _suffixFieldComponent?: StringInputFieldComponent;
    @ViewChild('descriptionFieldComponent', { static: true })
    private _descriptionFieldComponent?: StringTextareaFieldComponent;

    constructor(
        @Inject(TokenATMConfigurationManagerService)
        private configurationManagerService: TokenATMConfigurationManagerService
    ) {}

    ngOnInit() {
        if (!this._suffixFieldComponent || !this._descriptionFieldComponent || !this.configuration) return;
        this._suffixFieldComponent.initValue = this.configuration.suffix;
        this._descriptionFieldComponent.initValue = this.configuration.description;
        this.isProcessing = false;
    }

    onCancel() {
        this.modalRef?.hide();
    }

    async onEditConfiguration() {
        if (!this.configuration || !this._suffixFieldComponent || !this._descriptionFieldComponent) return;
        this.isProcessing = true;
        await this.configurationManagerService.updateTokenATMMetadata(this.configuration, {
            suffix: await this._suffixFieldComponent.getValue(),
            description: await this._descriptionFieldComponent.getValue()
        });
        this.modalRef?.hide();
        this.isProcessing = false;
    }
}
