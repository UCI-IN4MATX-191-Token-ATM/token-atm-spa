import { Component, OnInit, ViewChild } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { SpendForLabSwitchTokenOption } from 'app/token-options/spend-for-lab-switch-token-option';
import type { NumberInputFieldComponent } from '../../number-input-field/number-input-field.component';
import type { StringInputFieldComponent } from '../../string-input-field/string-input-field.component';
import type { StringTextareaFieldComponent } from '../../string-textarea-field/string-textarea-field.component';
import { TokenOptionField } from '../token-option-field';

@Component({
    selector: 'app-spend-for-lab-switch-token-option-field',
    templateUrl: './spend-for-lab-switch-token-option-field.component.html',
    styleUrls: ['./spend-for-lab-switch-token-option-field.component.sass']
})
export class SpendForLabSwitchTokenOptionFieldComponent
    extends TokenOptionField<SpendForLabSwitchTokenOption>
    implements OnInit
{
    private _value?: TokenOptionGroup | SpendForLabSwitchTokenOption;
    @ViewChild('idFieldComponent', { static: true }) private _idField?: NumberInputFieldComponent;
    @ViewChild('nameFieldComponent', { static: true }) private _nameField?: StringInputFieldComponent;
    @ViewChild('descriptionFieldComponent', { static: true }) private _descriptionField?: StringTextareaFieldComponent;
    @ViewChild('tokenBalanceChangeFieldComponent', { static: true })
    private _tokenBalanceChangeField?: NumberInputFieldComponent;
    @ViewChild('excludeTokenOptionIdsFieldComponent', { static: true })
    private _excludeTokenOptionIdsField?: StringInputFieldComponent;

    public set initValue(initValue: SpendForLabSwitchTokenOption | TokenOptionGroup) {
        this._value = initValue;
    }

    ngOnInit(): void {
        if (
            !this._value ||
            !this._idField ||
            !this._nameField ||
            !this._descriptionField ||
            !this._tokenBalanceChangeField ||
            !this._excludeTokenOptionIdsField
        )
            throw new Error('Fields are not ready yet!');
        this.addSubField(this._nameField);
        this.addSubField(this._descriptionField);
        this.addSubField(this._tokenBalanceChangeField);
        this.addSubField(this._excludeTokenOptionIdsField);
        if (this._value instanceof TokenOptionGroup) {
            this._idField.initValue = this._value.configuration.nextFreeTokenOptionId;
            this._nameField.initValue = '';
            this._descriptionField.initValue = '';
            this._tokenBalanceChangeField.initValue = 0;
            this._excludeTokenOptionIdsField.initValue = '';
        } else {
            this._idField.initValue = this._value.id;
            this._nameField.initValue = this._value.name;
            this._descriptionField.initValue = this._value.description;
            this._tokenBalanceChangeField.initValue = this._value.tokenBalanceChange;
            this._excludeTokenOptionIdsField.initValue = this._value.excludeTokenOptionIds.join(',');
        }
        this._nameField.validator = async (value: string) => {
            if (value.length == 0) return 'Token option name cannot be empty';
            return undefined;
        };
        this._excludeTokenOptionIdsField.validator = async (value: string) => {
            const values = value.split(',');
            for (const value of values) {
                const trimmedValue = value.trim();
                if (trimmedValue.length == 0) continue;
                if (isNaN(parseInt(trimmedValue))) return 'Non-numeric value exists in the list!';
            }
            return undefined;
        };
    }

    public async getValue(): Promise<SpendForLabSwitchTokenOption> {
        if (
            !this._value ||
            !this._idField ||
            !this._nameField ||
            !this._descriptionField ||
            !this._tokenBalanceChangeField ||
            !this._excludeTokenOptionIdsField
        )
            throw new Error('Value is not ready yet!');
        if (this._value instanceof TokenOptionGroup) {
            return new SpendForLabSwitchTokenOption(
                this._value,
                'spend-for-lab-switch',
                await this._idField.getValue(),
                await this._nameField.getValue(),
                await this._descriptionField.getValue(),
                await this._tokenBalanceChangeField.getValue(),
                (await this._excludeTokenOptionIdsField.getValue())
                    .split(',')
                    .filter((value: string) => value.trim().length != 0)
                    .map((value: string) => parseInt(value.trim()))
            );
        } else {
            this._value.name = await this._nameField.getValue();
            this._value.description = await this._descriptionField.getValue();
            this._value.tokenBalanceChange = await this._tokenBalanceChangeField.getValue();
            this._value.excludeTokenOptionIds = (await this._excludeTokenOptionIdsField.getValue())
                .split(',')
                .filter((value: string) => value.trim().length != 0)
                .map((value: string) => parseInt(value.trim()));
            return this._value;
        }
    }
}
