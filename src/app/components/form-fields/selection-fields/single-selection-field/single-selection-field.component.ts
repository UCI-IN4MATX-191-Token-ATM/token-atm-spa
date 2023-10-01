import { Component, Input } from '@angular/core';
import { ErrorSerializer } from 'app/utils/error-serailizer';
import { BaseFormField } from 'app/utils/form-field/form-field';
import { isEqual } from 'lodash';

@Component({
    selector: 'app-single-selection-field',
    templateUrl: './single-selection-field.component.html',
    styleUrls: ['./single-selection-field.component.sass']
})
export class SingleSelectionFieldComponent<T> extends BaseFormField<
    [T | undefined, () => Promise<T[]>],
    T | undefined,
    [T | undefined, SingleSelectionFieldComponent<T>]
> {
    @Input() optionRenderer: (value: T) => string = (v) => (v as object).toString();
    @Input() isEqual: (a: T, b: T) => boolean = isEqual;
    @Input() allowUnselect = false;
    value?: T | undefined;
    isProcessing = false;

    options: T[] = [];

    validOptions: T[] = [];
    invalidOption: T | undefined = undefined;

    private _filterText = '';
    isInvalidOptionFiltered = false;
    filteredValidOptionInds = new Set<number>();

    isOptionSettingFailed = false;
    private optionFactory?: () => Promise<T[]>;

    public get filterText(): string {
        return this._filterText;
    }

    public set filterText(filterText: string) {
        this._filterText = filterText;
        this.isInvalidOptionFiltered =
            !!this.invalidOption &&
            this.optionRenderer(this.invalidOption).toLowerCase().indexOf(this.filterText.toLowerCase()) != -1;
        this.filteredValidOptionInds.clear();
        for (const [ind, v] of this.validOptions.entries()) {
            if (this.optionRenderer(v).toLowerCase().indexOf(this.filterText.toLowerCase()) == -1) continue;
            this.filteredValidOptionInds.add(ind);
        }
    }

    public override set srcValue([selectedOption, optionFactory]: [T | undefined, () => Promise<T[]>]) {
        (async () => {
            if (this.isOptionSettingFailed) return;
            this.isProcessing = true;
            try {
                this.optionFactory = optionFactory;
                const options = await this.optionFactory();
                this.assignOptions(selectedOption, options);
                this.invalidOptionsValidate();
            } catch (err: unknown) {
                this.errorMessage = `Error occured when setting options: ${ErrorSerializer.serailize(err)}`;
                this.isOptionSettingFailed = true;
            } finally {
                this.isProcessing = false;
            }
        })();
    }

    public override get destValue(): Promise<T | undefined> {
        return Promise.resolve(this.value);
    }

    private assignOptions(selectedOption: T | undefined, options: T[]) {
        this.invalidOption = undefined;
        if (selectedOption != undefined && !options.some((v) => this.isEqual(selectedOption, v)))
            this.invalidOption = selectedOption;
        this.validOptions = options;
        this.value = selectedOption;
        this.filterText = '';
    }

    refreshOptions() {
        if (!this.optionFactory) return;
        this.srcValue = [this.value, this.optionFactory];
    }

    private invalidOptionsValidate(value?: T): boolean {
        this.errorMessage = undefined;
        value = value ?? this.value;
        if (value == undefined) return true;
        if (!!value && !!this.invalidOption && this.isEqual(value, this.invalidOption)) {
            this.errorMessage = `Selected option is invalid.`;
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

    get isInvalidOptionSelected(): boolean {
        return !!this.value && !!this.invalidOption && this.isEqual(this.value, this.invalidOption);
    }

    onSelectValueChange(value: T | undefined) {
        if (this.isInvalidOptionSelected) this.invalidOptionsValidate(value);
    }
}
