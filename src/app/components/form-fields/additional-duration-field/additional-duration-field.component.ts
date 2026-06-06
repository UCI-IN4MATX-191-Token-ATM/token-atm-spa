import { Component, Input, ViewChild, ViewContainerRef, type OnInit } from '@angular/core';
import type { DirectFormField } from 'app/utils/form-field/direct-form-field';
import { type FormFieldComponentBuilder } from 'app/utils/form-field/form-field-component-builder';
import { ListFieldComponent } from '../list-field/list-field.component';
import { type DurationData } from 'app/data/date-fns-duration';

type ValidDurationData = Omit<DurationData, ''>;
type ValidDurationDataProps = keyof ValidDurationData;

export type SingleDurationResult = [ValidDurationDataProps, number];

@Component({
    selector: 'app-additional-duration-field',
    templateUrl: './additional-duration-field.component.html',
    styleUrl: './additional-duration-field.component.sass'
})
export class AdditionalDurationFieldComponent
    implements DirectFormField<ValidDurationData, AdditionalDurationFieldComponent>, OnInit
{
    @Input() durationFieldBuilderFactory?: () => FormFieldComponentBuilder<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        DirectFormField<SingleDurationResult, any>
    >;

    @Input() defaultDurationValueProvider?: () => SingleDurationResult;

    @ViewChild('defaultDurationContainer', { read: ViewContainerRef, static: true })
    defaultDurationContainerRef?: ViewContainerRef;
    @ViewChild(ListFieldComponent, { static: true }) listFieldComponent?: ListFieldComponent<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        DirectFormField<SingleDurationResult, any>
    >;

    errorMessage: string | undefined = undefined;
    validator: (value: AdditionalDurationFieldComponent) => Promise<boolean> = async () => true;
    hasAdditional = false;
    private _label = '';
    private _isReadOnly = false;
    private _defaultDurationField?: DirectFormField<
        SingleDurationResult,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [DirectFormField<SingleDurationResult, any>, SingleDurationResult, boolean]
    >;
    private isInitialized = false;
    private _delayedInitValue?: ValidDurationData;

    constructor() {}

    ngOnInit(): void {
        if (!this.durationFieldBuilderFactory || !this.defaultDurationContainerRef || !this.listFieldComponent) {
            throw new Error('Failed to initialize AdditionalDurationFieldComponent');
        }
        const [renderer, field] = this.durationFieldBuilderFactory().build();
        renderer(this.defaultDurationContainerRef);
        this._defaultDurationField = field;
        this.isInitialized = true;
        if (this._delayedInitValue != undefined) this.srcValue = this._delayedInitValue;
        this.label = this.label as string; // Why not use this._label
        this.isReadOnly = this.isReadOnly as boolean; // Why not use this._isReadOnly
    }
    set srcValue(srcValue: ValidDurationData) {
        if (!this.isInitialized) {
            this._delayedInitValue = srcValue;
            return;
        }
        if (!this._defaultDurationField || !this.listFieldComponent) return;
        this.listFieldComponent.defaultFieldSrcValueProvider = () => {
            return this.defaultDurationValueProvider ? this.defaultDurationValueProvider() : ['days', 0];
        };
        this.listFieldComponent.fieldFactory = () => {
            if (!this.durationFieldBuilderFactory)
                throw new Error('Failed to initialize list item for AdditionalDurationFieldComponent');
            return this.durationFieldBuilderFactory().build();
        };
        const value = Object.entries<number>(srcValue) as SingleDurationResult[];
        if (value.length === 1) {
            this._defaultDurationField.srcValue = value[0]!;
        } else if (value.length > 1) {
            this._defaultDurationField.srcValue = value.shift()!;
            this.listFieldComponent.srcValue = value;
        } else {
            this._defaultDurationField.srcValue = this.listFieldComponent.defaultFieldSrcValueProvider();
        }
    }

    get destValue(): Promise<ValidDurationData> {
        return (async () => {
            if (!this._defaultDurationField || !this.listFieldComponent)
                throw new Error('AdditionalDurationFieldComponent');
            const defaultDuration = await this._defaultDurationField.destValue;
            const additionalDurations = await this.listFieldComponent.destValue;
            const result: ValidDurationData = {};
            [defaultDuration, ...additionalDurations].forEach(([dur, num]) => {
                if ((result[dur] ?? 0) === 0 && num === 0) return;
                if (!Number.isSafeInteger((result[dur] ?? 0) + num)) {
                    throw new Error('The result of an addition is not a representable integer value');
                }
                result[dur] = (result[dur] ?? 0) + num;
            });
            return result;
        })();
    }

    @Input() set label(label: string) {
        this._label = label;
        if (this._defaultDurationField) this._defaultDurationField.label = label;
    }

    get label(): string {
        return this._label;
    }

    set isReadOnly(isReadOnly: boolean) {
        this._isReadOnly = isReadOnly;
        if (this._defaultDurationField) this._defaultDurationField.isReadOnly = isReadOnly;
        if (this.listFieldComponent) this.listFieldComponent.isReadOnly = isReadOnly;
    }

    get isReadOnly(): boolean {
        return this._isReadOnly;
    }

    async validate(): Promise<boolean> {
        if (!this.isInitialized) return false;
        if (!this._defaultDurationField || !this.listFieldComponent) return false;
        const defaultDurationResult = await this._defaultDurationField.validate();
        const listFieldResult = await this.listFieldComponent.validate();
        const curResult = await this.validator(this);
        return defaultDurationResult && listFieldResult && curResult;
    }
}
