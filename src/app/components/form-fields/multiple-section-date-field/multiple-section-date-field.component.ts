import { Component, EnvironmentInjector, Inject, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { CanvasService } from 'app/services/canvas.service';
import type { FormField } from 'app/utils/form-field/form-field';
import type { FormFieldComponentBuilder } from 'app/utils/form-field/form-field-component-builder';
import { DateOverride, MultipleSectionDateMatcher } from 'app/utils/multiple-section-date-matcher';
import { ListFieldComponent } from '../list-field/list-field.component';
import { v4 } from 'uuid';
import { createFieldComponentWithLabel } from 'app/token-option-field-component-factories/token-option-field-component-factory';
import { StringInputFieldComponent } from '../string-input-field/string-input-field.component';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';

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
            throw new Error('Fail to initialize MultipleSectionDateFieldComponent');
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
                throw new Error('Fail to initialize list item for MultipleSectionDateFieldComponent');
            return createFieldComponentWithLabel(
                StringInputFieldComponent,
                'Section Names (separated by comma)',
                this.environmentInjector
            )
                .appendField(new StaticFormField<string>())
                .editField((field) => {
                    field.validator = async (value: typeof field) => {
                        value.fieldA.errorMessage = undefined;
                        const [sectionNamesStr, courseId] = await value.destValue;
                        const sectionNames = sectionNamesStr.split(',').map((value) => value.trim());
                        const sections = await this.canvasService.getSections(courseId);
                        const existSectionNames = new Set(
                            (await DataConversionHelper.convertAsyncIterableToList(sections)).map(
                                (section) => section.name
                            )
                        );
                        let sectionCnt = 0;
                        for (const sectionName of sectionNames) {
                            if (sectionName.length == 0) continue;
                            sectionCnt++;
                            if (!existSectionNames.has(sectionName)) {
                                value.fieldA.errorMessage = `Section ${sectionName} does not exist`;
                                return false;
                            }
                        }
                        if (sectionCnt == 0) {
                            value.fieldA.errorMessage = 'No section is specified';
                            return false;
                        }
                        return true;
                    };
                })
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
                        override.sections.map((section) => section[0]).join(','),
                        courseId,
                        override.name,
                        override.date
                    ];
                })
                .transformDest(async ([sectionNamesStr, courseId, displayName, date]) => {
                    const sectionNameIdMap = new Map<string, string>();
                    for await (const section of await this.canvasService.getSections(courseId)) {
                        sectionNameIdMap.set(section.name, section.id);
                    }
                    const sections: [string, string][] = [];
                    for (let sectionName of sectionNamesStr.split(',')) {
                        sectionName = sectionName.trim();
                        if (sectionName.length == 0) continue;
                        sections.push([sectionName, sectionNameIdMap.get(sectionName) as string]);
                    }
                    return {
                        sections: sections,
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
