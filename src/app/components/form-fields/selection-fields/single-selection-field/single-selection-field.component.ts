import { Component, EventEmitter, Inject, Input, type OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorSerializer } from 'app/utils/error-serailizer';
import { BaseFormField, type ObservableFormField } from 'app/utils/form-field/form-field';
import type { FormFieldCopyPasteHandler } from 'app/utils/form-field/form-field-copy-paste-handler';
import { isEqual } from 'lodash';
import { filter, firstValueFrom, Subject, takeUntil } from 'rxjs';
import { v4 } from 'uuid';

@Component({
    selector: 'app-single-selection-field',
    templateUrl: './single-selection-field.component.html',
    styleUrls: ['./single-selection-field.component.sass']
})
export class SingleSelectionFieldComponent<T>
    extends BaseFormField<
        [T | undefined, () => Promise<T[]>],
        T | undefined,
        [T | undefined, SingleSelectionFieldComponent<T>]
    >
    implements OnDestroy, ObservableFormField<T | undefined>
{
    @Input() optionRenderer: (value: T) => string = (v) => (v as object).toString();
    @Input() isEqual: (a: T, b: T) => boolean = isEqual;
    @Input() allowUnselect = false;
    @Input() copyPasteHandler?: FormFieldCopyPasteHandler<T | undefined>;
    value?: T | undefined;
    _destValue$ = new Subject<T | undefined>();
    srcValueTaskCnt = 0;
    srcValueTasks: string[] = [];
    srcValueTaskStatus$ = new EventEmitter<string>();

    options: T[] = [];

    validOptions: T[] = [];
    invalidOption: T | undefined = undefined;

    private _filterText = '';
    isInvalidOptionFiltered = false;
    filteredValidOptionInds = new Set<number>();

    isOptionSettingFailed = false;
    private optionFactory?: () => Promise<T[]>;

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
                this.assignOptions(selectedOption, options);
            } catch (err: unknown) {
                this.isOptionSettingFailed = true;
                this.errorMessage = `Error occured when setting options: ${ErrorSerializer.serailize(err)}`;
                if (!isAssigningOptions) this.assignOptions(selectedOption, []);
            } finally {
                this.srcValueTaskCnt--;
                const ind = this.srcValueTasks.indexOf(taskId);
                this.srcValueTasks.splice(ind, 1);
                if (isTaskTurn && this.srcValueTasks.length != 0) this.srcValueTaskStatus$.emit(this.srcValueTasks[0]);
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
        this._destValue$.next(this.value);
        this.filterText = '';
        this.invalidOptionsValidate();
    }

    refreshOptions() {
        if (!this.optionFactory) return;
        this.srcValue = [this.value, this.optionFactory];
    }

    private invalidOptionsValidate(value?: T): boolean {
        if (!this.isOptionSettingFailed) this.errorMessage = undefined;
        value = value ?? this.value;
        if (value == undefined) return true;
        if (!!value && !!this.invalidOption && this.isEqual(value, this.invalidOption) && !this.isOptionSettingFailed) {
            this.errorMessage = `Selection is invalid.`;
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

    get destValue$(): Subject<T | undefined> {
        return this._destValue$;
    }

    onSelectValueChange(value: T | undefined) {
        if (
            !(value === undefined && this.value === undefined) &&
            (value === undefined || this.value === undefined || !this.isEqual(value, this.value))
        )
            this._destValue$.next(value);
        if (this.isInvalidOptionSelected) this.invalidOptionsValidate(value);
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
        this._destValue$.complete();
    }
}
