import { Component, EnvironmentInjector, Inject, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { CanvasService } from 'app/services/canvas.service';
import type { FormField } from 'app/utils/form-field/form-field';
import type { FormFieldComponentBuilder } from 'app/utils/form-field/form-field-component-builder';
import { DateOverride, MultipleSectionDateMatcher } from 'app/utils/multiple-section-date-matcher';
import { ListFieldComponent } from '../list-field/list-field.component';
import { v4 } from 'uuid';
import { createFieldComponentWithLabel } from 'app/token-option-field-component-factories/token-option-field-component-factory';
import { StringInputFieldComponent } from '../string-input-field/string-input-field.component';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';
import { MultipleSelectionFieldComponent } from '../selection-fields/multiple-selection-field/multiple-selection-field.component';
import * as t from 'io-ts';
import { unwrapValidation } from 'app/utils/validation-unwrapper';

const SectionDataDef = t.type({
    id: t.string,
    name: t.string
});
const SectionDataArrayDef = t.array(SectionDataDef);

type SectionData = t.TypeOf<typeof SectionDataDef>;

@Component({
    selector: 'app-multiple-section-date-field',
    templateUrl: './multiple-section-date-field.component.html',
    styleUrls: ['./multiple-section-date-field.component.sass']
})
export class MultipleSectionDateFieldComponent
    implements
        FormField<
            [string, Date | MultipleSectionDateMatcher],
            Date | MultipleSectionDateMatcher,
            MultipleSectionDateFieldComponent
        >,
        OnInit
{
    fieldId = v4();
    @Input() dateFieldBuilderFactory?: () => FormFieldComponentBuilder<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        FormField<Date, Date, any>
    >;

    @ViewChild('defaultDateContainer', { read: ViewContainerRef, static: true })
    defaultDateContainerRef?: ViewContainerRef;
    @ViewChild(ListFieldComponent, { static: true }) listFieldComponent?: ListFieldComponent<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        FormField<[DateOverride, string], DateOverride, any>
    >;

    errorMessage = undefined;
    validator: (value: MultipleSectionDateFieldComponent) => Promise<boolean> = async () => true;
    hasException = false;
    private _label = '';
    private _isReadOnly = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _defaultDateField?: FormField<Date, Date, [FormField<Date, Date, any>, Date, boolean]>;
    private isInitialized = false;
    private _delayedInitValue?: [string, Date | MultipleSectionDateMatcher];

    constructor(
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(EnvironmentInjector) private environmentInjector: EnvironmentInjector
    ) {}

    ngOnInit(): void {
        if (!this.dateFieldBuilderFactory || !this.defaultDateContainerRef || !this.listFieldComponent)
            throw new Error('Failed to initialize MultipleSectionDateFieldComponent');
        const [renderer, field] = this.dateFieldBuilderFactory().build();
        renderer(this.defaultDateContainerRef);
        this._defaultDateField = field;
        this.isInitialized = true;
        if (this._delayedInitValue != undefined) this.srcValue = this._delayedInitValue;
        this.label = this.label as string;
        this.isReadOnly = this.isReadOnly as boolean;
    }

    set srcValue(srcValue: [string, Date | MultipleSectionDateMatcher]) {
        if (!this.isInitialized) {
            this._delayedInitValue = srcValue;
            return;
        }
        if (!this._defaultDateField || !this.listFieldComponent) return;
        const [courseId, value] = srcValue;
        this.listFieldComponent.fieldFactory = () => {
            if (!this.dateFieldBuilderFactory)
                throw new Error('Failed to initialize list item for MultipleSectionDateFieldComponent');
            return createFieldComponentWithLabel(
                MultipleSelectionFieldComponent<SectionData>,
                'Section Names',
                this.environmentInjector
            )
                .editField((field) => {
                    field.optionRenderer = (v) => v.name;
                    field.copyPasteHandler = {
                        serialize: async (value: SectionData[]) => JSON.stringify(SectionDataArrayDef.encode(value)),
                        deserialize: async (value: string) =>
                            unwrapValidation(SectionDataArrayDef.decode(JSON.parse(value)))
                    };
                    field.validator = async ([v, field]: [
                        SectionData[],
                        MultipleSelectionFieldComponent<SectionData>
                    ]) => {
                        field.errorMessage = undefined;
                        if (v.length == 0) {
                            field.errorMessage = 'Please select at least one Canvas section';
                            return false;
                        }
                        return true;
                    };
                })
                .transformDest(async (v) => ({
                    data: v
                }))
                .appendBuilder(
                    createFieldComponentWithLabel(
                        StringInputFieldComponent,
                        'Display Name',
                        this.environmentInjector
                    ).editField((field) => {
                        field.validator = async ([field, value]: [StringInputFieldComponent, string]) => {
                            field.errorMessage = undefined;
                            if (value.length == 0) {
                                field.errorMessage = 'Display name cannot be empty';
                                return false;
                            }
                            return true;
                        };
                    })
                )
                .appendBuilder(this.dateFieldBuilderFactory())
                .transformSrc(([override, courseId]: [DateOverride, string]) => {
                    return [
                        override.sections.map((section) => ({
                            id: section[1],
                            name: section[0]
                        })),
                        async () =>
                            (
                                await DataConversionHelper.convertAsyncIterableToList(
                                    await this.canvasService.getSections(courseId)
                                )
                            ).map((v) => ({
                                id: v.id,
                                name: v.name
                            })),
                        override.name,
                        override.date
                    ];
                })
                .transformDest(async ([{ data: sections }, displayName, date]) => {
                    return {
                        sections: sections.map((v) => [v.name, v.id] as [string, string]),
                        name: displayName,
                        date: date
                    };
                })
                .editField((field) => {
                    field.srcValue = [
                        {
                            sections: [],
                            name: '',
                            date: new Date()
                        },
                        courseId
                    ];
                })
                .build();
        };
        if (value instanceof MultipleSectionDateMatcher) {
            this._defaultDateField.srcValue = value.defaultDate;
            this.listFieldComponent.srcValue = value.overrides.map((override) => [override, courseId]);
            this.hasException = value.overrides.length != 0;
        } else {
            this._defaultDateField.srcValue = value;
            this.hasException = false;
        }
    }

    get destValue(): Promise<Date | MultipleSectionDateMatcher> {
        return (async () => {
            if (!this._defaultDateField || !this.listFieldComponent)
                throw new Error('Invalid MultipleSectionDateFieldComponent');
            const defaultDate = await this._defaultDateField.destValue;
            const overrides = await this.listFieldComponent.destValue;
            if (!this.hasException || overrides.length == 0) return defaultDate;
            return new MultipleSectionDateMatcher(defaultDate, overrides);
        })();
    }

    @Input() set label(label: string) {
        this._label = label;
        if (this._defaultDateField) this._defaultDateField.label = label;
    }

    get label(): string {
        return this._label;
    }

    set isReadOnly(isReadOnly: boolean) {
        this._isReadOnly = isReadOnly;
        if (this._defaultDateField) this._defaultDateField.isReadOnly = isReadOnly;
        if (this.listFieldComponent) this.listFieldComponent.isReadOnly = isReadOnly;
    }

    get isReadOnly(): boolean {
        return this._isReadOnly;
    }

    async validate(): Promise<boolean> {
        if (!this.isInitialized) return false;
        if (!this._defaultDateField || !this.listFieldComponent) return false;
        let result = true;
        const defaultDateResult = await this._defaultDateField.validate();
        const listFieldResult = !this.hasException ? true : await this.listFieldComponent.validate();
        const curResult = await this.validator(this);
        result &&= defaultDateResult;
        result &&= listFieldResult;
        result &&= curResult;
        return result;
    }
}
