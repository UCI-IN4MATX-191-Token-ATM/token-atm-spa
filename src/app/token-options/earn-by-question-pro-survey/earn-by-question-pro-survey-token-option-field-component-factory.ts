import {
    TokenOptionFieldComponentFactory,
    createEndTimeComponentBuilder,
    createFieldComponentWithLabel,
    createStartTimeComponentBuilder,
    tokenOptionFieldComponentBuilder
} from '../../token-option-field-component-factories/token-option-field-component-factory';
import {
    Injectable,
    EnvironmentInjector,
    ViewContainerRef,
    Inject,
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    createComponent
} from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { BaseFormField, FormField, ObservableFormField } from 'app/utils/form-field/form-field';
import { StringInputFieldComponent } from 'app/components/form-fields/string-input-field/string-input-field.component';
import { set } from 'date-fns';
import {
    EarnByQuestionProSurveyTokenOption,
    EarnByQuestionProSurveyTokenOptionData,
    EarnByQuestionProSurveyTokenOptionDataDef
} from 'app/token-options/earn-by-question-pro-survey/earn-by-question-pro-survey-token-option';
import type { DirectFormField } from 'app/utils/form-field/direct-form-field';
import type { FormFieldWrapper } from 'app/utils/form-field/form-field-wrapper';
import type { Subscription } from 'rxjs';
import { QuestionProService } from 'app/services/question-pro.service';
import { SingleSelectionFieldComponent } from 'app/components/form-fields/selection-fields/single-selection-field/single-selection-field.component';
import type { FormFieldComponentBuilder } from 'app/utils/form-field/form-field-component-builder';
import { SwitchFieldComponent } from 'app/components/form-fields/switch-field/switch-field.component';
import {
    LazyLoadData,
    LazySingleSelectionFieldComponent
} from 'app/components/form-fields/selection-fields/single-selection-field/lazy-single-selection-field.component';
import type { QuestionProSurveyMixinData } from 'app/token-options/mixins/question-pro-survey-mixin';
import { isEqual } from 'lodash';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';
import { ErrorMessageFieldComponent } from 'app/components/form-fields/error-message-field/error-message-field.component';

type SurveyData = Pick<EarnByQuestionProSurveyTokenOptionData, 'surveyId' | 'surveyName'>;
type SurveyResponseField = Pick<EarnByQuestionProSurveyTokenOptionData, 'responseField'>;
type LazyQuestionProSurveyMixinData = {
    data: QuestionProSurveyMixinData;
    hasSurveyLoaded: boolean;
    hasQuestionLoaded: boolean;
};

@Component({
    selector: 'app-earn-by-question-pro-survey-form-field',
    template:
        '<div [hidden]="survey?.data === undefined"><ng-container #container></ng-container></div><p *ngIf="survey?.data === undefined">Please select a QuestionPro survey first.</p>'
})
export class EarnByQuestionProSurveyFormFieldComponent
    extends BaseFormField<QuestionProSurveyMixinData | undefined, LazyQuestionProSurveyMixinData, unknown>
    implements
        FormFieldWrapper<
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            FormField<SurveyData | undefined, LazyLoadData<SurveyData>, any> &
                ObservableFormField<LazyLoadData<SurveyData>>,
            QuestionProSurveyMixinData | undefined,
            LazyQuestionProSurveyMixinData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >,
        OnInit,
        OnDestroy
{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private subscription?: Subscription;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private surveyField?: FormField<SurveyData | undefined, LazyLoadData<SurveyData>, any> &
        ObservableFormField<LazyLoadData<SurveyData>>;
    survey?: LazyLoadData<SurveyData>;
    private field: FormField<
        | [undefined, undefined]
        | [string, 'customVariable', string | undefined]
        | [string, 'studentResponse', undefined]
        | [string, 'studentResponse', string, string],
        LazyLoadData<SurveyResponseField>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
    >;
    private renderer: (containerRef: ViewContainerRef) => void;
    @ViewChild('container', { static: true, read: ViewContainerRef }) private containerRef?: ViewContainerRef;

    constructor(
        @Inject(QuestionProService) private questionProService: QuestionProService,
        @Inject(EnvironmentInjector) private environmentInjector: EnvironmentInjector
    ) {
        super();
        const _builder = createFieldComponentWithLabel(
            SingleSelectionFieldComponent<'Custom Variable' | 'Student Response'>,
            'Collect Email From',
            this.environmentInjector
        )
            .editField((field) => {
                field.validator = async ([v, f]: [
                    'Custom Variable' | 'Student Response' | undefined,
                    typeof field
                ]) => {
                    f.errorMessage = undefined;
                    if (v === undefined) {
                        f.errorMessage = 'Please select a method to collect student email!';
                        return false;
                    }
                    return true;
                };
            })
            .transformObservableSrc((v: 'Custom Variable' | 'Student Response') => [
                v,
                async () => ['Custom Variable', 'Student Response']
            ]) as FormFieldComponentBuilder<
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            DirectFormField<'Custom Variable' | 'Student Response' | undefined, any> &
                ObservableFormField<'Custom Variable' | 'Student Response' | undefined>
        >;
        [this.renderer, this.field] = _builder
            .wrapSuffix(
                createFieldComponentWithLabel(
                    SwitchFieldComponent<
                        'Custom Variable' | 'Student Response',
                        {
                            'Custom Variable': string;
                            'Student Response': [[string, string] | undefined, () => Promise<[string, string][]>];
                        },
                        {
                            'Custom Variable': string;
                            'Student Response': LazyLoadData<[string, string]>;
                        }
                    >,
                    '',
                    this.environmentInjector
                ).editField((field) => {
                    field.addField(
                        'Custom Variable',
                        createFieldComponentWithLabel(
                            StringInputFieldComponent,
                            'Custom Variable Name',
                            this.environmentInjector
                        ).editField((field) => {
                            field.validator = async ([f, v]: [typeof field, string]) => {
                                f.errorMessage = undefined;
                                if (v.trim().length == 0) {
                                    f.errorMessage = 'Custom variable name cannot be empty!';
                                    return false;
                                }
                                return true;
                            };
                        })
                    );
                    field.addField(
                        'Student Response',
                        createFieldComponentWithLabel(
                            LazySingleSelectionFieldComponent<[string, string]>,
                            'Question for Email',
                            this.environmentInjector
                        ).editField((field) => {
                            field.allowUnselect = true;
                            field.optionRenderer = (v) => v[1];
                            field.validator = async ([v, f]: [[string, string] | undefined, typeof field]) => {
                                f.errorMessage = undefined;
                                if (v === undefined) {
                                    f.errorMessage = 'Please select a question!';
                                    return false;
                                }
                                return true;
                            };
                        })
                    );
                })
            )
            .transformSrc(
                (
                    v:
                        | [undefined, undefined]
                        | [string, 'customVariable', string | undefined]
                        | [string, 'studentResponse', undefined]
                        | [string, 'studentResponse', string, string]
                ) => {
                    if (v[0] === undefined) return ['Custom Variable', ''];
                    if (v[1] == 'customVariable') return ['Custom Variable', v[2] ?? ''];
                    return [
                        'Student Response',
                        [
                            v[2] !== undefined ? [v[2], v[3]] : undefined,
                            async () =>
                                await DataConversionHelper.convertAsyncIterableToList(
                                    await this.questionProService.getQuestions(v[0])
                                )
                        ]
                    ];
                }
            )
            .transformDest(async (v) => {
                if (v[0] === undefined) throw new Error('Invalid data');
                switch (v[0]) {
                    case 'Custom Variable':
                        return {
                            data: {
                                responseField: {
                                    type: 'customVariable' as const,
                                    variableName: v[1]
                                }
                            },
                            hasLoaded: true
                        };
                    case 'Student Response': {
                        if (v[1].data === undefined) throw new Error('Invalid data');
                        return {
                            data: {
                                responseField: {
                                    type: 'studentResponse' as const,
                                    questionId: v[1].data[0],
                                    questionName: v[1].data[1]
                                }
                            },
                            hasLoaded: v[1].hasLoaded
                        };
                    }
                }
            })
            .build();
    }

    set wrappedField(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wrappedField: FormField<SurveyData | undefined, LazyLoadData<SurveyData>, any> &
            ObservableFormField<LazyLoadData<SurveyData>>
    ) {
        this.surveyField = wrappedField;
        this.subscription = this.surveyField.destValue$.subscribe((x) => this.onValueUpdate(x));
    }

    private onValueUpdate(key: LazyLoadData<SurveyData>): void {
        if (isEqual(this.survey, key)) return;
        const isDataEqual = isEqual(this.survey?.data, key.data);
        this.survey = key;
        if (isDataEqual) return;
        if (this.survey.data === undefined) {
            this.field.srcValue = [undefined, undefined];
            return;
        }
        this.field.srcValue = [this.survey.data.surveyId, 'studentResponse', undefined];
        this.field.srcValue = [this.survey.data.surveyId, 'customVariable', undefined];
    }

    public override set srcValue(value: QuestionProSurveyMixinData | undefined) {
        if (!this.surveyField) throw new Error('Fail to initialize EarnByQuestionProSurveyFormFieldComponent');
        this.surveyField.srcValue =
            value === undefined
                ? undefined
                : {
                      surveyId: value.surveyId,
                      surveyName: value.surveyName
                  };
        if (value !== undefined) {
            if (value.responseField.type == 'studentResponse') {
                this.field.srcValue = [
                    value.surveyId,
                    'studentResponse',
                    value.responseField.questionId,
                    value.responseField.questionName
                ];
            } else {
                this.field.srcValue = [value.surveyId, 'studentResponse', undefined];
                this.field.srcValue = [value.surveyId, 'customVariable', value.responseField.variableName];
            }
        }
    }

    public override get destValue(): Promise<LazyQuestionProSurveyMixinData> {
        return (async () => {
            if (!this.survey || !this.survey.data) throw new Error('Invalid data');
            const responseField = await this.field.destValue;
            if (!responseField.data) throw new Error('Invalid data');
            return {
                data: {
                    ...this.survey.data,
                    ...responseField.data
                },
                hasSurveyLoaded: this.survey.hasLoaded,
                hasQuestionLoaded: responseField.hasLoaded
            };
        })();
    }

    public override async validate(): Promise<boolean> {
        const surveyRes = await this.surveyField?.validate();
        const fieldRes = await this.field.validate();
        return (surveyRes && fieldRes) ?? false;
    }

    public override set isReadOnly(isReadOnly: boolean) {
        if (this.surveyField) this.surveyField.isReadOnly = isReadOnly;
        this.field.isReadOnly = isReadOnly;
    }

    ngOnInit(): void {
        if (!this.containerRef) throw new Error('Fail to initialize EarnByQuestionProSurveyFormFieldComponent');
        this.renderer(this.containerRef);
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
}

@Injectable()
export class EarnByQuestionProSurveyTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<EarnByQuestionProSurveyTokenOption> {
    constructor(@Inject(QuestionProService) private questionProService: QuestionProService) {
        super();
    }

    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        FormField<EarnByQuestionProSurveyTokenOption | TokenOptionGroup, EarnByQuestionProSurveyTokenOptionData, any>
    ] {
        return tokenOptionFieldComponentBuilder(environmentInjector)
            .appendBuilder(
                (
                    createFieldComponentWithLabel(
                        LazySingleSelectionFieldComponent<SurveyData>,
                        'QuestionPro Survey',
                        environmentInjector
                    )
                        .editField((field) => {
                            field.allowUnselect = true;
                            field.optionRenderer = (v) => v.surveyName;
                            field.validator = async ([v, f]: [SurveyData | undefined, typeof field]) => {
                                f.errorMessage = undefined;
                                if (v === undefined) {
                                    f.errorMessage = 'Please select a survey!';
                                    return false;
                                }
                                return true;
                            };
                        })
                        .transformObservableSrc((v: SurveyData | undefined) => [
                            v,
                            async () =>
                                (
                                    await DataConversionHelper.convertAsyncIterableToList(
                                        await this.questionProService.getSurveys()
                                    )
                                ).map(([surveyId, surveyName]) => ({
                                    surveyId,
                                    surveyName
                                }))
                        ]) as FormFieldComponentBuilder<
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        FormField<SurveyData | undefined, LazyLoadData<SurveyData>, any> &
                            ObservableFormField<LazyLoadData<SurveyData>>
                    >
                ).wrapSuffix(
                    createFieldComponentWithLabel(EarnByQuestionProSurveyFormFieldComponent, '', environmentInjector)
                )
            )
            .appendBuilder(createStartTimeComponentBuilder(environmentInjector))
            .appendBuilder(createEndTimeComponentBuilder(environmentInjector))
            .transformSrc((value: EarnByQuestionProSurveyTokenOption | TokenOptionGroup) => {
                if (value instanceof TokenOptionGroup) {
                    return [
                        value,
                        undefined,
                        set(new Date(), {
                            hours: 0,
                            minutes: 0,
                            seconds: 0,
                            milliseconds: 0
                        }),
                        set(new Date(), {
                            hours: 23,
                            minutes: 59,
                            seconds: 59,
                            milliseconds: 999
                        })
                    ];
                } else {
                    return [value, value, value.startTime, value.endTime];
                }
            })
            .transformDest(async ([tokenOptionData, surveyData, startTime, endTime]) => {
                return {
                    ...tokenOptionData,
                    type: 'earn-by-question-pro-survey',
                    surveyData,
                    startTime,
                    endTime
                };
            })
            .appendComp(
                createComponent(ErrorMessageFieldComponent, {
                    environmentInjector: environmentInjector
                })
            )
            .modify({
                validate: async (field, superFunc) => {
                    const dataField = field.fieldA;
                    const errField = field.fieldB;
                    errField.srcValue = undefined;
                    try {
                        const superFuncRes = await superFunc();
                        if (!superFuncRes) {
                            errField.srcValue =
                                'Invalid token option data: check error message under each field for details';
                            return false;
                        }
                        const rawData = await dataField.destValue;
                        const trimmedRawData: typeof rawData | Partial<Pick<typeof rawData, 'surveyData'>> =
                            structuredClone(rawData);
                        delete trimmedRawData.surveyData;
                        const data = {
                            ...trimmedRawData,
                            ...rawData.surveyData.data
                        };

                        if (!EarnByQuestionProSurveyTokenOptionDataDef.is(data)) {
                            errField.srcValue =
                                'Invalid token option data: check error message under each field for details';
                            return false;
                        }
                        if (rawData.surveyData.hasSurveyLoaded && rawData.surveyData.hasQuestionLoaded) return true;
                        if (
                            !rawData.surveyData.hasSurveyLoaded &&
                            !(await this.questionProService.hasSurvey(rawData.surveyData.data.surveyId))
                        ) {
                            errField.srcValue = 'Invalid QuestionPro survey data: specified survey does not exist';
                            return false;
                        }
                        if (
                            !rawData.surveyData.hasQuestionLoaded &&
                            rawData.surveyData.data.responseField.type == 'studentResponse' &&
                            !(await this.questionProService.hasQuestion(
                                rawData.surveyData.data.surveyId,
                                rawData.surveyData.data.responseField.questionId
                            ))
                        ) {
                            errField.srcValue =
                                'Invalid QuestionPro survey data: specified survey question does not exist';
                            return false;
                        }
                        return true;
                    } catch (e: unknown) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        errField.srcValue = `Failed to construct token option data: ${(e as any).toString()}`;
                        return false;
                    }
                }
            })
            .transformSrc(
                (v: EarnByQuestionProSurveyTokenOption | TokenOptionGroup) =>
                    [v, undefined] as [EarnByQuestionProSurveyTokenOption, undefined] | [TokenOptionGroup, undefined]
            )
            .transformDest(async (v) => ({
                ...v[0],
                surveyData: undefined,
                ...v[0].surveyData.data
            }))
            .build();
    }
    public override get type(): string {
        return 'earn-by-question-pro-survey';
    }
}
