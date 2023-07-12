import { Component, OnInit, ViewChild } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { BasicTokenOption } from 'app/token-options/basic-token-option';
import type { NumberInputFieldComponent } from '../../number-input-field/number-input-field.component';
import type { StringInputFieldComponent } from '../../string-input-field/string-input-field.component';
import type { StringTextareaFieldComponent } from '../../string-textarea-field/string-textarea-field.component';
import { TokenOptionField } from '../token-option-field';

@Component({
    selector: 'app-basic-token-option-field',
    templateUrl: './basic-token-option-field.component.html',
    styleUrls: ['./basic-token-option-field.component.sass']
})
export class BasicTokenOptionFieldComponent extends TokenOptionField<BasicTokenOption> implements OnInit {
    private _value?: TokenOptionGroup | BasicTokenOption;
    @ViewChild('idFieldComponent', { static: true }) private _idField?: NumberInputFieldComponent;
    @ViewChild('nameFieldComponent', { static: true }) private _nameField?: StringInputFieldComponent;
    @ViewChild('descriptionFieldComponent', { static: true }) private _descriptionField?: StringTextareaFieldComponent;
    @ViewChild('tokenBalanceChangeFieldComponent', { static: true })
    private _tokenBalanceChangeField?: NumberInputFieldComponent;

    public set initValue(initValue: BasicTokenOption | TokenOptionGroup) {
        this._value = initValue;
    }

    ngOnInit(): void {
        if (
            !this._value ||
            !this._idField ||
            !this._nameField ||
            !this._descriptionField ||
            !this._tokenBalanceChangeField
        )
            throw new Error('Fields are not ready yet!');
        this.addSubField(this._nameField);
        this.addSubField(this._descriptionField);
        this.addSubField(this._tokenBalanceChangeField);
        if (this._value instanceof TokenOptionGroup) {
            this._idField.initValue = this._value.configuration.nextFreeTokenOptionId;
            this._nameField.initValue = '';
            this._descriptionField.initValue = '';
            this._tokenBalanceChangeField.initValue = 0;
        } else {
            this._idField.initValue = this._value.id;
            this._nameField.initValue = this._value.name;
            this._descriptionField.initValue = this._value.description;
            this._tokenBalanceChangeField.initValue = this._value.tokenBalanceChange;
        }
        this._nameField.validator = async (value: string) => {
            if (value.length == 0) return 'Token option name cannot be empty';
            return undefined;
        };
    }

    public async getValue(): Promise<BasicTokenOption> {
        if (
            !this._value ||
            !this._idField ||
            !this._nameField ||
            !this._descriptionField ||
            !this._tokenBalanceChangeField
        )
            throw new Error('Value is not ready yet!');
        if (this._value instanceof TokenOptionGroup) {
            return new BasicTokenOption(
                this._value,
                'basic',
                await this._idField.getValue(),
                await this._nameField.getValue(),
                await this._descriptionField.getValue(),
                await this._tokenBalanceChangeField.getValue(),
                false
            );
        } else {
            this._value.name = await this._nameField.getValue();
            this._value.description = await this._descriptionField.getValue();
            this._value.tokenBalanceChange = await this._tokenBalanceChangeField.getValue();
            return this._value;
        }
    }
}
