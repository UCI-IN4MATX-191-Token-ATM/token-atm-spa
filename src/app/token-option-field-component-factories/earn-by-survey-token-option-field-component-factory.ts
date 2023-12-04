import {
    TokenOptionFieldComponentFactory,
    createEndTimeComponentBuilder,
    createFieldComponentWithLabel,
    createStartTimeComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from './token-option-field-component-factory';
import { Injectable, type EnvironmentInjector, type ViewContainerRef, Inject, createComponent } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import { StringInputFieldComponent } from 'app/components/form-fields/string-input-field/string-input-field.component';
import { set } from 'date-fns';
import {
    EarnBySurveyTokenOptionDataDef,
    type EarnBySurveyTokenOption,
    type EarnBySurveyTokenOptionData
} from 'app/token-options/earn-by-survey-token-option';
import { QualtricsService } from 'app/services/qualtrics.service';

@Injectable()
export class EarnBySurveyTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<EarnBySurveyTokenOption> {
    constructor(@Inject(QualtricsService) private qualtricsService: QualtricsService) {
        super();
    }

    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        FormField<EarnBySurveyTokenOption | TokenOptionGroup, EarnBySurveyTokenOptionData, any>
    ] {
        const surveyFieldNameComp = createComponent(StringInputFieldComponent, {
            environmentInjector: environmentInjector
        });
        surveyFieldNameComp.instance.label = 'Survey Field Name for Respondent’s Email (from SSO)';

        const surveyDetailsCombinedComp = createFieldComponentWithLabel(
            StringInputFieldComponent,
            'Qualtrics Survey ID',
            environmentInjector
        )
            .appendComp(surveyFieldNameComp)
            .editField((field) => {
                // Survey ID validator
                field.fieldA.validator = async (value) => {
                    field.fieldA.errorMessage = undefined;
                    const inputComp = value[0];
                    const surveyId = await value[0].destValue;
                    if (surveyId.trim() === '') {
                        inputComp.errorMessage = 'A Survey ID must be supplied.';
                        return false;
                    }
                    try {
                        await this.qualtricsService.checkSurveyExists(surveyId);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (err: any) {
                        inputComp.errorMessage = err.toString();
                        return false;
                    }
                    return true;
                };
                // Survey Field Name Validator
                field.fieldB.validator = async (value) => {
                    field.fieldB.errorMessage = undefined;
                    const inputComp = value[0];
                    const fieldName = await value[0].destValue;
                    const surveyId = await field.fieldA.destValue;
                    if (field.fieldA.errorMessage != undefined) {
                        inputComp.errorMessage = 'A valid Survey ID must be supplied above.';
                        return false;
                    }
                    try {
                        await this.qualtricsService.checkResponseSchemaForField(surveyId, fieldName);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (err: any) {
                        inputComp.errorMessage = err.toString();
                        return false;
                    }
                    return true;
                };
            });

        return tokenOptionValidationWrapper(
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .appendBuilder(surveyDetailsCombinedComp)
                .appendBuilder(createStartTimeComponentBuilder(environmentInjector))
                .appendBuilder(createEndTimeComponentBuilder(environmentInjector))
                .transformSrc((value: EarnBySurveyTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        return [
                            value,
                            ['', ''],
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
                        return [value, [value.surveyId, value.fieldName], value.startTime, value.endTime];
                    }
                })
                .transformDest(async ([tokenOptionData, [surveyId, fieldName], startTime, endTime]) => {
                    return {
                        ...tokenOptionData,
                        type: 'earn-by-survey',
                        surveyId,
                        fieldName,
                        startTime,
                        endTime
                    };
                }),
            EarnBySurveyTokenOptionDataDef.is
        ).build();
    }
    public override get type(): string {
        return 'earn-by-survey';
    }
}
