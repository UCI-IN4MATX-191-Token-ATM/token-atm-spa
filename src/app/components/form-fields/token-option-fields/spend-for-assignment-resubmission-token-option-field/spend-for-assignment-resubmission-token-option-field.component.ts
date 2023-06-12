import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { CanvasService } from 'app/services/canvas.service';
import { SpendForAssignmentResubmissionTokenOption } from 'app/token-options/spend-for-assignment-resubmission-token-option';
import { set } from 'date-fns';
import type { DateTimeFieldComponent } from '../../date-time-field/date-time-field.component';
import type { NumberInputFieldComponent } from '../../number-input-field/number-input-field.component';
import type { StringInputFieldComponent } from '../../string-input-field/string-input-field.component';
import type { StringTextareaFieldComponent } from '../../string-textarea-field/string-textarea-field.component';
import { TokenOptionField } from '../token-option-field';

@Component({
    selector: 'app-spend-for-assignment-resubmission-token-option-field',
    templateUrl: './spend-for-assignment-resubmission-token-option-field.component.html',
    styleUrls: ['./spend-for-assignment-resubmission-token-option-field.component.sass']
})
export class SpendForAssignmentResubmissionTokenOptionFieldComponent
    extends TokenOptionField<SpendForAssignmentResubmissionTokenOption>
    implements OnInit
{
    private _value?: TokenOptionGroup | SpendForAssignmentResubmissionTokenOption;
    @ViewChild('idFieldComponent', { static: true }) private _idField?: NumberInputFieldComponent;
    @ViewChild('nameFieldComponent', { static: true }) private _nameField?: StringInputFieldComponent;
    @ViewChild('descriptionFieldComponent', { static: true }) private _descriptionField?: StringTextareaFieldComponent;
    @ViewChild('tokenBalanceChangeFieldComponent', { static: true })
    private _tokenBalanceChangeField?: NumberInputFieldComponent;
    @ViewChild('assignmentNameFieldComponent', { static: true })
    private _assignmentNameField?: StringInputFieldComponent;
    @ViewChild('startTimeFieldComponent', { static: true }) private _startTimeField?: DateTimeFieldComponent;
    @ViewChild('endTimeFieldComponent', { static: true }) private _endTimeField?: DateTimeFieldComponent;
    @ViewChild('newDueTimeFieldComponent', { static: true }) private _newDueTimeField?: DateTimeFieldComponent;

    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public set initValue(initValue: SpendForAssignmentResubmissionTokenOption | TokenOptionGroup) {
        this._value = initValue;
    }

    public async getValue(): Promise<SpendForAssignmentResubmissionTokenOption> {
        if (
            !this._value ||
            !this._idField ||
            !this._nameField ||
            !this._descriptionField ||
            !this._tokenBalanceChangeField ||
            !this._assignmentNameField ||
            !this._startTimeField ||
            !this._endTimeField ||
            !this._newDueTimeField
        ) {
            throw new Error('Value is not ready yet');
        }
        const courseId =
            this._value instanceof TokenOptionGroup
                ? this._value.configuration.course.id
                : this._value.group.configuration.course.id;
        if (this._value instanceof TokenOptionGroup) {
            return new SpendForAssignmentResubmissionTokenOption(
                this._value,
                'spend-for-assignment-resubmission',
                await this._idField.getValue(),
                await this._nameField.getValue(),
                await this._descriptionField.getValue(),
                await this._tokenBalanceChangeField.getValue(),
                await this._assignmentNameField.getValue(),
                await this.canvasService.getAssignmentIdByName(courseId, await this._assignmentNameField.getValue()),
                await this._startTimeField.getValue(),
                await this._endTimeField.getValue(),
                await this._newDueTimeField.getValue()
            );
        } else {
            this._value.name = await this._nameField.getValue();
            this._value.description = await this._descriptionField.getValue();
            this._value.tokenBalanceChange = await this._tokenBalanceChangeField.getValue();
            this._value.assignmentName = await this._assignmentNameField.getValue();
            this._value.assignmentId = await this.canvasService.getAssignmentIdByName(
                courseId,
                await this._assignmentNameField.getValue()
            );
            this._value.startTime = await this._startTimeField.getValue();
            this._value.endTime = await this._endTimeField.getValue();
            this._value.newDueTime = await this._newDueTimeField.getValue();
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
            !this._assignmentNameField ||
            !this._startTimeField ||
            !this._endTimeField ||
            !this._newDueTimeField
        ) {
            throw new Error('Fields are not ready yet!');
        }
        this.addSubField(this._nameField);
        this.addSubField(this._descriptionField);
        this.addSubField(this._tokenBalanceChangeField);
        this.addSubField(this._assignmentNameField);
        this.addSubField(this._startTimeField);
        this.addSubField(this._endTimeField);
        this.addSubField(this._newDueTimeField);
        if (this._value instanceof TokenOptionGroup) {
            this._idField.initValue = this._value.configuration.nextFreeTokenOptionId;
            this._nameField.initValue = '';
            this._descriptionField.initValue = '';
            this._tokenBalanceChangeField.initValue = 0;
            this._assignmentNameField.initValue = '';
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
            this._newDueTimeField.initValue = set(new Date(), {
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
            this._assignmentNameField.initValue = this._value.assignmentName;
            this._startTimeField.initValue = this._value.startTime;
            this._endTimeField.initValue = this._value.endTime;
            this._newDueTimeField.initValue = this._value.newDueTime;
        }
        const courseId =
            this._value instanceof TokenOptionGroup
                ? this._value.configuration.course.id
                : this._value.group.configuration.course.id;
        this._nameField.validator = async (value: string) => {
            if (value.length == 0) return 'Token option name cannot be empty';
            return undefined;
        };
        this._assignmentNameField.validator = async (value: string) => {
            try {
                await this.canvasService.getAssignmentIdByName(courseId, value);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                return err.toString();
            }
            return undefined;
        };
    }
}
