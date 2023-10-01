import { Component, Input } from '@angular/core';
import type { MatOption, MatOptionSelectionChange } from '@angular/material/core';
import { ErrorSerializer } from 'app/utils/error-serailizer';
import { BaseFormField } from 'app/utils/form-field/form-field';
import { pluralize } from 'app/utils/pluralize';
import { isEqual } from 'lodash';

@Component({
    selector: 'app-multiple-selection-field',
    templateUrl: './multiple-selection-field.component.html',
    styleUrls: ['./multiple-selection-field.component.sass']
})
export class MultipleSelectionFieldComponent<T> extends BaseFormField<
    [T[], () => Promise<T[]>],
    T[],
    [T[], MultipleSelectionFieldComponent<T>]
> {
    @Input() optionRenderer: (value: T) => string = (v) => (v as object).toString();
    @Input() isEqual: (a: T, b: T) => boolean = isEqual;
    value: T[] = [];
    isProcessing = false;

    validOptions: T[] = [];
    invalidOptions: T[] = [];

    private _filterText = '';
    filteredInvalidOptionInds = new Set<number>();
    filteredValidOptionInds = new Set<number>();

    isOptionSettingFailed = false;
    private optionFactory?: () => Promise<T[]>;

    isInvalidOptionValidationOutdated = false;

    public get filterText(): string {
        return this._filterText;
    }

    public set filterText(filterText: string) {
        this._filterText = filterText;
        this.filteredInvalidOptionInds.clear();
        this.filteredValidOptionInds.clear();
        for (const [ind, v] of this.invalidOptions.entries()) {
            if (this.optionRenderer(v).toLowerCase().indexOf(this.filterText.toLowerCase()) == -1) continue;
            this.filteredInvalidOptionInds.add(ind);
        }
        for (const [ind, v] of this.validOptions.entries()) {
            if (this.optionRenderer(v).toLowerCase().indexOf(this.filterText.toLowerCase()) == -1) continue;
            this.filteredValidOptionInds.add(ind);
        }
    }

    public override set srcValue([selectedOptions, optionFactory]: [T[], () => Promise<T[]>]) {
        (async () => {
            if (this.isOptionSettingFailed) return;
            this.isProcessing = true;
            try {
                this.optionFactory = optionFactory;
                const options = await this.optionFactory();
                this.assignOptions(selectedOptions, options);
                this.invalidOptionsValidate();
            } catch (err: unknown) {
                this.errorMessage = `Error occured when setting options: ${ErrorSerializer.serailize(err)}`;
                this.isOptionSettingFailed = true;
            } finally {
                this.isProcessing = false;
            }
        })();
    }

    public override get destValue(): Promise<T[]> {
        return Promise.resolve(this.value);
    }

    private assignOptions(selectedOptions: T[], options: T[]) {
        const invalidOptions: T[] = [];
        for (const option of selectedOptions) {
            if (options.some((v) => this.isEqual(option, v))) continue;
            invalidOptions.push(option);
        }
        this.invalidOptions = invalidOptions;
        this.validOptions = options;
        this.value = selectedOptions;
        this.filterText = '';
    }

    refreshOptions() {
        if (!this.optionFactory) return;
        this.srcValue = [this.value, this.optionFactory];
    }

    private invalidOptionsValidate(value?: T[]): boolean {
        this.errorMessage = undefined;
        value = value ?? this.value;
        const invalidOptions: T[] = [];
        for (const selectedOption of value) {
            if (this.invalidOptions.some((v) => this.isEqual(v, selectedOption))) invalidOptions.push(selectedOption);
        }
        if (invalidOptions.length != 0) {
            this.errorMessage = `Selected ${this.invalidOptions.length} invalid ${pluralize(
                'option',
                this.invalidOptions.length
            )}: ${invalidOptions.map((v) => this.optionRenderer(v)).join(', ')}.`;
            return false;
        }
        return true;
    }

    public override async validate(): Promise<boolean> {
        if (this.isOptionSettingFailed) return false;
        if (this.isProcessing) {
            this.errorMessage = 'Field is still loading';
            return false;
        }
        if (!this.invalidOptionsValidate()) return false;
        return await this.validator([this.value, this]);
    }

    onInvalidOptionDeselected(event: MatOptionSelectionChange, matOption: MatOption) {
        if (event.isUserInput && !matOption.selected) {
            matOption.disabled = true;
            this.isInvalidOptionValidationOutdated = true;
        }
    }

    onSelectValueChange(value: T[]) {
        if (!this.isInvalidOptionValidationOutdated) return;
        this.isInvalidOptionValidationOutdated = false;
        this.invalidOptionsValidate(value);
    }
}
