import { Component, OnInit, ViewChild } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { EarnBySurveyTokenOption } from 'app/token-options/earn-by-survey-token-option';
import { set } from 'date-fns';
import type { DateTimeFieldComponent } from '../../date-time-field/date-time-field.component';
import type { NumberInputFieldComponent } from '../../number-input-field/number-input-field.component';
import type { StringInputFieldComponent } from '../../string-input-field/string-input-field.component';
import type { StringTextareaFieldComponent } from '../../string-textarea-field/string-textarea-field.component';
import { TokenOptionField } from '../token-option-field';

@Component({
    selector: 'app-earn-by-survey-token-option-field',
    templateUrl: './earn-by-survey-token-option-field.component.html',
    styleUrls: ['./earn-by-survey-token-option-field.component.sass']
})
export class EarnBySurveyTokenOptionFieldComponent extends TokenOptionField<EarnBySurveyTokenOption> implements OnInit {
    private _value?: TokenOptionGroup | EarnBySurveyTokenOption;
    @ViewChild('idFieldComponent', { static: true }) private _idField?: NumberInputFieldComponent;
    @ViewChild('nameFieldComponent', { static: true }) private _nameField?: StringInputFieldComponent;
    @ViewChild('descriptionFieldComponent', { static: true }) private _descriptionField?: StringTextareaFieldComponent;
    @ViewChild('tokenBalanceChangeFieldComponent', { static: true })
    private _tokenBalanceChangeField?: NumberInputFieldComponent;
    @ViewChild('surveyIdFieldComponent', { static: true }) private _surveyIdField?: StringInputFieldComponent;
    @ViewChild('fieldNameFieldComponent', { static: true }) private _fieldNameField?: StringInputFieldComponent;
    @ViewChild('startTimeFieldComponent', { static: true }) private _startTimeField?: DateTimeFieldComponent;
    @ViewChild('endTimeFieldComponent', { static: true }) private _endTimeField?: DateTimeFieldComponent;

    constructor() {
        super();
        // TODO: verify survey id and field name?
    }

    public set initValue(initValue: EarnBySurveyTokenOption | TokenOptionGroup) {
        this._value = initValue;
    }

    public async getValue(): Promise<EarnBySurveyTokenOption> {
        if (
            !this._value ||
            !this._idField ||
            !this._nameField ||
            !this._descriptionField ||
            !this._tokenBalanceChangeField ||
            !this._surveyIdField ||
            !this._fieldNameField ||
            !this._startTimeField ||
            !this._endTimeField
        ) {
            throw new Error('Value is not ready yet');
        }
        if (this._value instanceof TokenOptionGroup) {
            return new EarnBySurveyTokenOption(
                this._value,
                'earn-by-survey',
                await this._idField.getValue(),
                await this._nameField.getValue(),
                await this._descriptionField.getValue(),
                await this._tokenBalanceChangeField.getValue(),
                false,
                await this._surveyIdField.getValue(),
                await this._fieldNameField.getValue(),
                await this._startTimeField.getValue(),
                await this._endTimeField.getValue()
            );
        } else {
            this._value.name = await this._nameField.getValue();
            this._value.description = await this._descriptionField.getValue();
            this._value.tokenBalanceChange = await this._tokenBalanceChangeField.getValue();
            this._value.surveyId = await this._surveyIdField.getValue();
            this._value.fieldName = await this._fieldNameField.getValue();
            this._value.startTime = await this._startTimeField.getValue();
            this._value.endTime = await this._endTimeField.getValue();
            return this._value;
        }
    }

    ngOnInit(): void {
        if (
            !this._value ||
            !this._idField ||
            !this._nameField ||
            !this._descriptionField ||
            !this._tokenBalanceChangeField ||
            !this._surveyIdField ||
            !this._fieldNameField ||
            !this._startTimeField ||
            !this._endTimeField
        ) {
            throw new Error('Fields are not ready yet!');
        }
        this.addSubField(this._nameField);
        this.addSubField(this._descriptionField);
        this.addSubField(this._tokenBalanceChangeField);
        this.addSubField(this._surveyIdField);
        this.addSubField(this._fieldNameField);
        this.addSubField(this._startTimeField);
        this.addSubField(this._endTimeField);
        if (this._value instanceof TokenOptionGroup) {
            this._idField.initValue = this._value.configuration.nextFreeTokenOptionId;
            this._nameField.initValue = '';
            this._descriptionField.initValue = '';
            this._tokenBalanceChangeField.initValue = 0;
            this._surveyIdField.initValue = '';
            this._fieldNameField.initValue = '';
            this._startTimeField.initValue = set(new Date(), {
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0
            });
            this._endTimeField.initValue = set(new Date(), {
                hours: 23,
                minutes: 59,
                seconds: 59,
                milliseconds: 999
            });
        } else {
            this._idField.initValue = this._value.id;
            this._nameField.initValue = this._value.name;
            this._descriptionField.initValue = this._value.description;
            this._tokenBalanceChangeField.initValue = this._value.tokenBalanceChange;
            this._surveyIdField.initValue = this._value.surveyId;
            this._fieldNameField.initValue = this._value.fieldName;
            this._startTimeField.initValue = this._value.startTime;
            this._endTimeField.initValue = this._value.endTime;
        }
        this._nameField.validator = async (value: string) => {
            if (value.length == 0) return 'Token option name cannot be empty';
            return undefined;
        };
        this._surveyIdField.validator = async (value: string) => {
            if (value.length == 0) return 'Survey ID cannot be empty';
            return undefined;
        };
        this._fieldNameField.validator = async (value: string) => {
            if (value.length == 0) return 'Survey field name cannot be empty';
            return undefined;
        };
    }
}
