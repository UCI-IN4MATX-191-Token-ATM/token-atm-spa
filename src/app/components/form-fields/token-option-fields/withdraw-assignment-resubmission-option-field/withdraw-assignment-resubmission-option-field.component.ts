import { Component, OnInit, ViewChild } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { SpendForAssignmentResubmissionTokenOption } from 'app/token-options/spend-for-assignment-resubmission-token-option';
import { WithdrawAssignmentResubmissionTokenOption } from 'app/token-options/withdraw-assignment-resubmission-token-option';
import type { NumberInputFieldComponent } from '../../number-input-field/number-input-field.component';
import type { StringInputFieldComponent } from '../../string-input-field/string-input-field.component';
import type { StringTextareaFieldComponent } from '../../string-textarea-field/string-textarea-field.component';
import { TokenOptionField } from '../token-option-field';

@Component({
    selector: 'app-withdraw-assignment-resubmission-option-field',
    templateUrl: './withdraw-assignment-resubmission-option-field.component.html',
    styleUrls: ['./withdraw-assignment-resubmission-option-field.component.sass']
})
export class WithdrawAssignmentResubmissionOptionFieldComponent
    extends TokenOptionField<WithdrawAssignmentResubmissionTokenOption>
    implements OnInit
{
    private _value?: TokenOptionGroup | WithdrawAssignmentResubmissionTokenOption;
    @ViewChild('idFieldComponent', { static: true }) private _idField?: NumberInputFieldComponent;
    @ViewChild('nameFieldComponent', { static: true }) private _nameField?: StringInputFieldComponent;
    @ViewChild('descriptionFieldComponent', { static: true }) private _descriptionField?: StringTextareaFieldComponent;
    @ViewChild('tokenBalanceChangeFieldComponent', { static: true })
    private _tokenBalanceChangeField?: NumberInputFieldComponent;
    @ViewChild('withdrawTokenOptionIdFieldComponent', { static: true })
    private _withdrawTokenOptionIdField?: NumberInputFieldComponent;

    public set initValue(initValue: WithdrawAssignmentResubmissionTokenOption | TokenOptionGroup) {
        this._value = initValue;
    }

    ngOnInit(): void {
        if (
            !this._value ||
            !this._idField ||
            !this._nameField ||
            !this._descriptionField ||
            !this._tokenBalanceChangeField ||
            !this._withdrawTokenOptionIdField
        )
            throw new Error('Fields are not ready yet!');
        this.addSubField(this._nameField);
        this.addSubField(this._descriptionField);
        this.addSubField(this._tokenBalanceChangeField);
        this.addSubField(this._withdrawTokenOptionIdField);
        if (this._value instanceof TokenOptionGroup) {
            this._idField.initValue = this._value.configuration.nextFreeTokenOptionId;
            this._nameField.initValue = '';
            this._descriptionField.initValue = '';
            this._tokenBalanceChangeField.initValue = 0;
            this._withdrawTokenOptionIdField.initValue = -1;
        } else {
            this._idField.initValue = this._value.id;
            this._nameField.initValue = this._value.name;
            this._descriptionField.initValue = this._value.description;
            this._tokenBalanceChangeField.initValue = this._value.tokenBalanceChange;
            this._withdrawTokenOptionIdField.initValue = this._value.withdrawTokenOptionId;
        }
        this._nameField.validator = async (value: string) => {
            if (value.length == 0) return 'Token option name cannot be empty';
            return undefined;
        };
        this._withdrawTokenOptionIdField.validator = async (value: number) => {
            const configuration =
                this._value instanceof TokenOptionGroup ? this._value.configuration : this._value?.group.configuration;
            const tokenOption = configuration?.getTokenOptionById(value);
            if (!tokenOption) return 'There is no token option with this id';
            if (!(tokenOption instanceof SpendForAssignmentResubmissionTokenOption))
                return "Token option type invalid: should be 'Spend Tokens for Assignment Resubmission'";
            return undefined;
        };
    }

    public async getValue(): Promise<WithdrawAssignmentResubmissionTokenOption> {
        if (
            !this._value ||
            !this._idField ||
            !this._nameField ||
            !this._descriptionField ||
            !this._tokenBalanceChangeField ||
            !this._withdrawTokenOptionIdField
        )
            throw new Error('Value is not ready yet!');
        if (this._value instanceof TokenOptionGroup) {
            return new WithdrawAssignmentResubmissionTokenOption(
                this._value,
                'withdraw-assignment-resubmission',
                await this._idField.getValue(),
                await this._nameField.getValue(),
                await this._descriptionField.getValue(),
                await this._tokenBalanceChangeField.getValue(),
                false,
                await this._withdrawTokenOptionIdField.getValue()
            );
        } else {
            this._value.name = await this._nameField.getValue();
            this._value.description = await this._descriptionField.getValue();
            this._value.tokenBalanceChange = await this._tokenBalanceChangeField.getValue();
            this._value.withdrawTokenOptionId = await this._withdrawTokenOptionIdField.getValue();
            return this._value;
        }
    }
}
