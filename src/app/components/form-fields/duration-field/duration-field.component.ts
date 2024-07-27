import { Component } from '@angular/core';
import { BaseDirectFormField } from 'app/utils/form-field/direct-form-field';
import type { SingleDurationResult } from '../additional-duration-field/additional-duration-field.component';

@Component({
    selector: 'app-duration-field',
    templateUrl: './duration-field.component.html',
    styleUrl: './duration-field.component.sass'
})
export class DurationFieldComponent extends BaseDirectFormField<
    SingleDurationResult,
    [DurationFieldComponent, SingleDurationResult, boolean]
> {
    // TODO: Implement UI and is selection Valid check
    isSelectionValid = true;

    constructor() {
        super();
        this.value = ['days', 0];
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
            field.errorMessage = 'Amount is invalid';
            return false;
        }
        return true;
    };

    public override async validate(): Promise<boolean> {
        return await this._validator([this, await this.destValue, this.isSelectionValid]);
    }
}
