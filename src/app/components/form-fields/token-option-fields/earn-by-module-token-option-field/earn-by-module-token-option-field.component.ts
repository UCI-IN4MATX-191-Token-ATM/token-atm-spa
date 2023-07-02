import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { CanvasService } from 'app/services/canvas.service';
import { EarnByModuleTokenOption } from 'app/token-options/earn-by-module-token-option';
import { set } from 'date-fns';
import type { DateTimeFieldComponent } from '../../date-time-field/date-time-field.component';
import type { NumberInputFieldComponent } from '../../number-input-field/number-input-field.component';
import type { StringInputFieldComponent } from '../../string-input-field/string-input-field.component';
import type { StringTextareaFieldComponent } from '../../string-textarea-field/string-textarea-field.component';
import { TokenOptionField } from '../token-option-field';

@Component({
    selector: 'app-earn-by-module-token-option-field',
    templateUrl: './earn-by-module-token-option-field.component.html',
    styleUrls: ['./earn-by-module-token-option-field.component.sass']
})
export class EarnByModuleTokenOptionFieldComponent extends TokenOptionField<EarnByModuleTokenOption> implements OnInit {
    private _value?: TokenOptionGroup | EarnByModuleTokenOption;
    @ViewChild('idFieldComponent', { static: true }) private _idField?: NumberInputFieldComponent;
    @ViewChild('nameFieldComponent', { static: true }) private _nameField?: StringInputFieldComponent;
    @ViewChild('descriptionFieldComponent', { static: true }) private _descriptionField?: StringTextareaFieldComponent;
    @ViewChild('tokenBalanceChangeFieldComponent', { static: true })
    private _tokenBalanceChangeField?: NumberInputFieldComponent;
    @ViewChild('moduleNameFieldComponent', { static: true }) private _moduleNameField?: StringInputFieldComponent;
    @ViewChild('startTimeFieldComponent', { static: true }) private _startTimeField?: DateTimeFieldComponent;
    @ViewChild('gradeThresholdComponent', { static: true }) private _gradeThreshold?: NumberInputFieldComponent;

    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public set initValue(initValue: EarnByModuleTokenOption | TokenOptionGroup) {
        this._value = initValue;
    }

    public async getValue(): Promise<EarnByModuleTokenOption> {
        if (
            !this._value ||
            !this._idField ||
            !this._nameField ||
            !this._descriptionField ||
            !this._tokenBalanceChangeField ||
            !this._moduleNameField ||
            !this._startTimeField ||
            !this._gradeThreshold
        ) {
            throw new Error('Value is not ready yet');
        }
        const courseId =
            this._value instanceof TokenOptionGroup
                ? this._value.configuration.course.id
                : this._value.group.configuration.course.id;
        if (this._value instanceof TokenOptionGroup) {
            return new EarnByModuleTokenOption(
                this._value,
                'earn-by-module',
                await this._idField.getValue(),
                await this._nameField.getValue(),
                await this._descriptionField.getValue(),
                await this._tokenBalanceChangeField.getValue(),
                await this._moduleNameField.getValue(),
                await this.canvasService.getModuleIdByName(courseId, await this._moduleNameField.getValue()),
                await this._startTimeField.getValue(),
                await this._gradeThreshold.getValue()
            );
        } else {
            this._value.name = await this._nameField.getValue();
            this._value.description = await this._descriptionField.getValue();
            this._value.tokenBalanceChange = await this._tokenBalanceChangeField.getValue();
            this._value.moduleName = await this._moduleNameField.getValue();
            this._value.moduleId = await this.canvasService.getModuleIdByName(
                courseId,
                await this._moduleNameField.getValue()
            );
            this._value.startTime = await this._startTimeField.getValue();
            this._value.gradeThreshold = await this._gradeThreshold.getValue();
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
            !this._moduleNameField ||
            !this._startTimeField ||
            !this._gradeThreshold
        ) {
            throw new Error('Fields are not ready yet!');
        }
        this.addSubField(this._nameField);
        this.addSubField(this._descriptionField);
        this.addSubField(this._tokenBalanceChangeField);
        this.addSubField(this._moduleNameField);
        this.addSubField(this._startTimeField);
        this.addSubField(this._gradeThreshold);
        if (this._value instanceof TokenOptionGroup) {
            this._idField.initValue = this._value.configuration.nextFreeTokenOptionId;
            this._nameField.initValue = '';
            this._descriptionField.initValue = '';
            this._tokenBalanceChangeField.initValue = 0;
            this._moduleNameField.initValue = '';
            this._startTimeField.initValue = set(new Date(), {
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0
            });
            this._gradeThreshold.initValue = 1;
        } else {
            this._idField.initValue = this._value.id;
            this._nameField.initValue = this._value.name;
            this._descriptionField.initValue = this._value.description;
            this._tokenBalanceChangeField.initValue = this._value.tokenBalanceChange;
            this._moduleNameField.initValue = this._value.moduleName;
            this._startTimeField.initValue = this._value.startTime;
            this._gradeThreshold.initValue = this._value.gradeThreshold;
        }
        const courseId =
            this._value instanceof TokenOptionGroup
                ? this._value.configuration.course.id
                : this._value.group.configuration.course.id;
        this._nameField.validator = async (value: string) => {
            if (value.length == 0) return 'Token option name cannot be empty';
            return undefined;
        };
        this._moduleNameField.validator = async (value: string) => {
            try {
                await this.canvasService.getModuleIdByName(courseId, value);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                return err.toString();
            }
            return undefined;
        };
        this._gradeThreshold.validator = async (value: number) => {
            if (value < 0 || value > 1)
                return 'Grade threshold needs to be a number between 0 and 1 (inclusive). E.g, 0.7';
            return undefined;
        };
    }
}
