import { Component, EnvironmentInjector, Inject, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { StringInputFieldComponent } from '../form-fields/string-input-field/string-input-field.component';
import { StringTextareaFieldComponent } from '../form-fields/string-textarea-field/string-textarea-field.component';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { BsModalRef } from 'ngx-bootstrap/modal';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { createFieldComponentWithLabel } from 'app/token-option-field-component-factories/token-option-field-component-factory';
import type { FormField } from 'app/utils/form-field/form-field';

@Component({
    selector: 'app-edit-configuration-modal',
    templateUrl: './edit-configuration-modal.component.html',
    styleUrls: ['./edit-configuration-modal.component.sass']
})
export class EditConfigurationModalComponent implements OnInit {
    _isProcessing = false;
    modalRef?: BsModalRef<unknown>;
    @Input() configuration?: TokenATMConfiguration;

    @ViewChild('container', { read: ViewContainerRef, static: true }) container?: ViewContainerRef;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field?: FormField<TokenATMConfiguration, [string, string], any>;

    constructor(
        @Inject(TokenATMConfigurationManagerService)
        private configurationManagerService: TokenATMConfigurationManagerService,
        @Inject(EnvironmentInjector)
        private environmentInjector: EnvironmentInjector
    ) {}

    ngOnInit() {
        if (!this.container || !this.configuration) throw new Error('Fail to initialize configuration editing modal');
        const [renderer, field] = createFieldComponentWithLabel(
            StringInputFieldComponent,
            'The suffix of Assignment Group & Module name',
            this.environmentInjector
        )
            .appendBuilder(
                createFieldComponentWithLabel(
                    StringTextareaFieldComponent,
                    'Description of Token ATM Log Assignment',
                    this.environmentInjector
                )
            )
            .transformSrc((value: TokenATMConfiguration) => {
                return [value.suffix, value.description];
            })
            .build();
        this.field = field;
        this.field.srcValue = this.configuration;
        renderer(this.container);
    }

    get isProcessing(): boolean {
        return this._isProcessing;
    }

    set isProcessing(isProcessing: boolean) {
        this._isProcessing = isProcessing;
        if (this.field) this.field.isReadOnly = isProcessing;
    }

    onCancel() {
        this.modalRef?.hide();
    }

    async onEditConfiguration() {
        if (!this.configuration || !this.field) return;
        this.isProcessing = true;
        if (!(await this.field.validate())) {
            this.isProcessing = false;
            return;
        }
        const [suffix, description] = await this.field.destValue;
        await this.configurationManagerService.updateTokenATMMetadata(this.configuration, {
            suffix: suffix,
            description: description
        });
        this.modalRef?.hide();
        this.isProcessing = false;
    }
}
