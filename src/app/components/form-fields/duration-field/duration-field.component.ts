import { Component } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { BaseDirectFormField } from 'app/utils/form-field/direct-form-field';
import type { SingleDurationResult } from '../additional-duration-field/additional-duration-field.component';
import { DurationProperties } from 'app/data/date-fns-duration';
import { TitleCasePipe } from '@angular/common';

@Component({
    selector: 'app-duration-field',
    templateUrl: './duration-field.component.html',
    styleUrl: './duration-field.component.sass',
    standalone: true,
    imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, TitleCasePipe]
})
export class DurationFieldComponent extends BaseDirectFormField<
    SingleDurationResult,
    [DurationFieldComponent, SingleDurationResult, boolean]
> {
    private _durValue: SingleDurationResult[0];
    private _numValue: SingleDurationResult[1];
    isSelectionValid = true;

    durations = structuredClone(DurationProperties);

    constructor() {
        super();
        this._durValue = 'days';
        this._numValue = 0;
        this.value = [this.durValue, this.numValue];
        this.validator = DurationFieldComponent.DEFAULT_VALIDATOR;
    }

    public static DEFAULT_VALIDATOR = async ([field, value, isSelectionValid]: [
        DurationFieldComponent,
        SingleDurationResult,
        boolean
    ]) => {
        field.errorMessage = undefined;
        if (!isSelectionValid) {
            field.errorMessage = 'Duration selection is invalid';
            return false;
        }
        if (!Number.isSafeInteger(value[1])) {
            field.errorMessage = 'Amount must be an integer';
            return false;
        }
        return true;
    };

    set durValue(duration: SingleDurationResult[0]) {
        this.isSelectionValid = this.durations.includes(duration);
        this.value = [duration, this.value?.[1] ?? 0];
        this._durValue = duration;
    }

    get durValue() {
        return this._durValue;
    }

    set numValue(amount: SingleDurationResult[1]) {
        this.value = [this.value?.[0] ?? 'days', amount];
        this._numValue = amount;
    }

    get numValue() {
        return this._numValue;
    }

    override set srcValue(srcValue: SingleDurationResult) {
        [this.durValue, this.numValue] = srcValue;
    }

    public override async validate(): Promise<boolean> {
        return await this._validator([this, await this.destValue, this.isSelectionValid]);
    }
}
