import { Component, EventEmitter, Inject, Input, type OnDestroy } from '@angular/core';
import type { MatOption, MatOptionSelectionChange } from '@angular/material/core';
import { ErrorSerializer } from 'app/utils/error-serailizer';
import { BaseFormField } from 'app/utils/form-field/form-field';
import type { FormFieldCopyPasteHandler } from 'app/utils/form-field/form-field-copy-paste-handler';
import { pluralize } from 'app/utils/pluralize';
import { isEqual } from 'lodash';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, firstValueFrom, takeUntil } from 'rxjs';
import { v4 } from 'uuid';

@Component({
    selector: 'app-multiple-selection-field',
    templateUrl: './multiple-selection-field.component.html',
    styleUrls: ['./multiple-selection-field.component.sass']
})
export class MultipleSelectionFieldComponent<T>
    extends BaseFormField<[T[], () => Promise<T[]>], T[], [T[], MultipleSelectionFieldComponent<T>]>
    implements OnDestroy
{
    @Input() optionRenderer: (value: T) => string = (v) => (v as object).toString();
    @Input() isEqual: (a: T, b: T) => boolean = isEqual;
    @Input() allowShowSelected = true;
    @Input() allowUnselectAll = true;
    @Input() copyPasteHandler?: FormFieldCopyPasteHandler<T[]>;
    value: T[] = [];
    srcValueTaskCnt = 0;
    srcValueTasks: string[] = [];
    srcValueTaskStatus$ = new EventEmitter<string>();

    onlyShowSelected = false;

    validOptions: T[] = [];
    invalidOptions: T[] = [];

    disabledInvalidOptionInds = new Set<number>();
    selectedInvalidOptionsCnt = 0;

    private _filterText = '';
    filteredInvalidOptionInds = new Set<number>();
    filteredValidOptionInds = new Set<number>();

    isOptionSettingFailed = false;
    private optionFactory?: () => Promise<T[]>;

    isInvalidOptionValidationOutdated = false;

    _onDestroy$ = new EventEmitter<void>();

    constructor(@Inject(MatSnackBar) private snackBar: MatSnackBar) {
        super();
    }

    public get isProcessing(): boolean {
        return this.srcValueTaskCnt != 0;
    }

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
            const taskId = v4();
            this.srcValueTasks.push(taskId);
            this.srcValueTaskCnt++;
            let isTaskTurn = false,
                isAssigningOptions = false;
            try {
                this.optionFactory = optionFactory;
                if (this.srcValueTasks[0] != taskId)
                    await firstValueFrom(
                        this.srcValueTaskStatus$.pipe(
                            filter((v) => v == taskId),
                            takeUntil(this._onDestroy$)
                        )
                    );
                isTaskTurn = true;
                const options = await this.optionFactory();
                isAssigningOptions = true;
                this.isOptionSettingFailed = false;
                this.assignOptions(selectedOptions, options);
            } catch (err: unknown) {
                this.isOptionSettingFailed = true;
                this.errorMessage = `Error occured when setting options: ${ErrorSerializer.serailize(err)}`;
                if (!isAssigningOptions) this.assignOptions(selectedOptions, []);
            } finally {
                this.srcValueTaskCnt--;
                const ind = this.srcValueTasks.indexOf(taskId);
                this.srcValueTasks.splice(ind, 1);
                if (isTaskTurn && this.srcValueTasks.length != 0) this.srcValueTaskStatus$.emit(this.srcValueTasks[0]);
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
        this.disabledInvalidOptionInds.clear();
        this.validOptions = options;
        this.value = selectedOptions;
        this.filterText = '';
        this.invalidOptionsValidate();
    }

    refreshOptions() {
        if (!this.optionFactory) return;
        this.srcValue = [this.value, this.optionFactory];
    }

    private invalidOptionsValidate(value?: T[]): boolean {
        if (!this.isOptionSettingFailed) this.errorMessage = undefined;
        value = value ?? this.value;
        const selectedInvalidOptions: T[] = [];
        for (const selectedOption of value) {
            if (this.invalidOptions.some((v) => this.isEqual(v, selectedOption)))
                selectedInvalidOptions.push(selectedOption);
        }
        this.selectedInvalidOptionsCnt = selectedInvalidOptions.length;
        if (selectedInvalidOptions.length != 0 && !this.isOptionSettingFailed) {
            this.errorMessage = `Found ${this.invalidOptions.length} invalid ${pluralize(
                'selection',
                this.invalidOptions.length
            )}: ${selectedInvalidOptions.map((v) => this.optionRenderer(v)).join(', ')}.`;
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

    onInvalidOptionDeselected(event: MatOptionSelectionChange, matOption: MatOption, ind: number) {
        if (event.isUserInput && !matOption.selected) {
            this.disabledInvalidOptionInds.add(ind);
            this.isInvalidOptionValidationOutdated = true;
        }
    }

    onSelectValueChange(value: T[]) {
        if (!this.isInvalidOptionValidationOutdated) return;
        this.isInvalidOptionValidationOutdated = false;
        this.invalidOptionsValidate(value);
    }

    onUnselectAll() {
        this.value = [];
        for (let i = 0; i < this.invalidOptions.length; i++) this.disabledInvalidOptionInds.add(i);
    }

    async onCopy(): Promise<void> {
        if (!this.copyPasteHandler) {
            this.snackBar.open('Copy & Paste is not supported for this field', 'Dismiss', {
                duration: 3000
            });
            return;
        }
        try {
            await navigator.clipboard.writeText(await this.copyPasteHandler.serialize(this.value));
            this.snackBar.open('Content Copied', 'Dismiss', {
                duration: 3000
            });
        } catch (err: unknown) {
            this.snackBar.open('Error occurred when copying', 'Dismiss', {
                duration: 3000
            });
        }
    }

    async onPaste(): Promise<void> {
        if (!this.copyPasteHandler) {
            this.snackBar.open('Copy & Paste is not supported for this field', 'Dismiss', {
                duration: 3000
            });
            return;
        }
        try {
            const text = await navigator.clipboard.readText();
            this.assignOptions(await this.copyPasteHandler.deserialize(text), this.validOptions);
            this.snackBar.open('Content Pasted', 'Dismiss', {
                duration: 3000
            });
        } catch (err: unknown) {
            this.snackBar.open('Error occurred when pasting', 'Dismiss', {
                duration: 3000
            });
        }
    }

    ngOnDestroy(): void {
        this._onDestroy$.emit();
        this._onDestroy$.complete();
        this.srcValueTaskStatus$.complete();
    }
}
