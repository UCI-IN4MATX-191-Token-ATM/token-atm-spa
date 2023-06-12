import { Component, Inject, Input, ViewChild } from '@angular/core';
import type { Course } from 'app/data/course';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { StringInputFieldComponent } from '../form-fields/string-input-field/string-input-field.component';
import type { StringTextareaFieldComponent } from '../form-fields/string-textarea-field/string-textarea-field.component';

@Component({
    selector: 'app-create-configuration-modal',
    templateUrl: './create-configuration-modal.component.html',
    styleUrls: ['./create-configuration-modal.component.sass']
})
export class CreateConfigurationModalComponent {
    isProcessing = false;
    @Input() onResolve?: (reuslt: boolean) => void;
    @Input() course?: Course;

    @ViewChild('suffixFieldComponent', { static: true }) private _suffixFieldComponent?: StringInputFieldComponent;
    @ViewChild('descriptionFieldComponent', { static: true })
    private _descriptionFieldComponent?: StringTextareaFieldComponent;

    constructor(
        @Inject(TokenATMConfigurationManagerService)
        private configurationManagerService: TokenATMConfigurationManagerService
    ) {}

    onCancel() {
        if (this.onResolve) this.onResolve(false);
    }

    async onCreateConfiguration(): Promise<void> {
        if (!this.course || !this._suffixFieldComponent || !this._descriptionFieldComponent || !this.onResolve) return;
        this.isProcessing = true;
        await this.configurationManagerService.createTokenATMConfiguration(
            this.course,
            await this._suffixFieldComponent.getValue(),
            await this._descriptionFieldComponent.getValue()
        );
        this.onResolve(true);
    }
}
