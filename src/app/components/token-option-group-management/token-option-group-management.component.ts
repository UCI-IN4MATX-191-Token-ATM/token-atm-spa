import { Component, EnvironmentInjector, Inject, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { BsModalRef } from 'ngx-bootstrap/modal';
import { StringInputFieldComponent } from '../form-fields/string-input-field/string-input-field.component';
import { StringTextareaFieldComponent } from '../form-fields/string-textarea-field/string-textarea-field.component';
import { createFieldComponentWithLabel } from 'app/token-option-field-component-factories/token-option-field-component-factory';
import { NumberInputFieldComponent } from '../form-fields/number-input-field/number-input-field.component';
import type { FormField } from 'app/utils/form-field/form-field';

@Component({
    selector: 'app-token-option-group-management',
    templateUrl: './token-option-group-management.component.html',
    styleUrls: ['./token-option-group-management.component.sass']
})
export class TokenOptionGroupManagementComponent implements OnInit {
    @Input() value?: TokenATMConfiguration | TokenOptionGroup;
    modalRef?: BsModalRef<unknown>;
    private _isProcessing = false;

    @ViewChild('container', { read: ViewContainerRef, static: true }) container?: ViewContainerRef;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field?: FormField<TokenATMConfiguration | TokenOptionGroup, [number, string, string], any>;

    constructor(
        @Inject(TokenATMConfigurationManagerService) private managerService: TokenATMConfigurationManagerService,
        @Inject(EnvironmentInjector) private environmentInjector: EnvironmentInjector
    ) {}

    ngOnInit(): void {
        if (!this.value || !this.container) throw new Error('Fail to initialize token option group management modal');
        const [renderer, field] = createFieldComponentWithLabel(
            NumberInputFieldComponent,
            'Group ID',
            this.environmentInjector
        )
            .editField((field) => {
                field.isReadOnly = true;
            })
            .modify({
                setIsReadOnly: (field) => {
                    field.isReadOnly = true;
                }
            })
            .appendBuilder(
                createFieldComponentWithLabel(
                    StringInputFieldComponent,
                    'Group Name',
                    this.environmentInjector
                ).editField((field) => {
                    field.validator = async ([field, value]: [StringInputFieldComponent, string]) => {
                        field.errorMessage = undefined;
                        if (value.length == 0) {
                            field.errorMessage = 'Name cannot be empty';
                            return false;
                        }
                        return true;
                    };
                })
            )
            .appendBuilder(
                createFieldComponentWithLabel(
                    StringTextareaFieldComponent,
                    'Group Description',
                    this.environmentInjector
                ).editField((field) => {
                    field.rows = 4;
                })
            )
            .transformSrc((value: TokenOptionGroup | TokenATMConfiguration) => {
                if (value instanceof TokenATMConfiguration) {
                    return [value.nextFreeTokenOptionGroupId, '', ''];
                } else {
                    return [value.id, value.name, value.description];
                }
            })
            .build();
        this.field = field;
        this.field.srcValue = this.value;
        renderer(this.container);
    }

    get isEditing(): boolean {
        return this.value instanceof TokenOptionGroup;
    }

    async onSave(): Promise<void> {
        if (!this.field) return;
        this.isProcessing = true;
        if (!(await this.field.validate())) {
            this.isProcessing = false;
            return;
        }
        const group = this.value as TokenOptionGroup;
        const result = await this.field.destValue;
        group.name = result[1];
        group.description = result[2];
        await this.managerService.updateTokenOptionGroupMetadata(group);
        this.isProcessing = false;
        this.modalRef?.hide();
    }

    async onCreate(): Promise<void> {
        if (!this.field) return;
        this.isProcessing = true;
        if (!(await this.field.validate())) {
            this.isProcessing = false;
            return;
        }
        const configuration = this.value as TokenATMConfiguration;
        const [id, name, description] = await this.field.destValue;
        await this.managerService.addNewTokenOptionGroup(
            new TokenOptionGroup(configuration, name, id, '', description, false, [])
        );
        this.isProcessing = false;
        this.modalRef?.hide();
    }

    public set isProcessing(isProcessing: boolean) {
        this._isProcessing = isProcessing;
        if (this.field) this.field.isReadOnly = isProcessing;
    }

    public get isProcessing(): boolean {
        return this._isProcessing;
    }
}
