import {
    TokenOptionFieldComponentFactory,
    createEndTimeComponentBuilder,
    createFieldComponentWithLabel,
    createStartTimeComponentBuilder,
    tokenOptionFieldComponentBuilder
} from './token-option-field-component-factory';
import { Injectable, type EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import { StringInputFieldComponent } from 'app/components/form-fields/string-input-field/string-input-field.component';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
import { set } from 'date-fns';
import { EarnBySurveyTokenOption } from 'app/token-options/earn-by-survey-token-option';

@Injectable()
export class EarnBySurveyTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<EarnBySurveyTokenOption> {
    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        FormField<EarnBySurveyTokenOption | TokenOptionGroup, EarnBySurveyTokenOption, any>
    ] {
        return tokenOptionFieldComponentBuilder(environmentInjector)
            .appendBuilder(createFieldComponentWithLabel(StringInputFieldComponent, 'Survey ID', environmentInjector))
            .appendBuilder(
                createFieldComponentWithLabel(StringInputFieldComponent, 'Survey Field Name', environmentInjector)
            )
            .appendBuilder(createStartTimeComponentBuilder(environmentInjector))
            .appendBuilder(createEndTimeComponentBuilder(environmentInjector))
            .appendField(new StaticFormField<EarnBySurveyTokenOption | TokenOptionGroup>())
            .transformSrc((value: EarnBySurveyTokenOption | TokenOptionGroup) => {
                if (value instanceof TokenOptionGroup) {
                    return [
                        value,
                        '',
                        '',
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
                        }),
                        value
                    ];
                } else {
                    return [value, value.surveyId, value.fieldName, value.startTime, value.endTime, value];
                }
            })
            .transformDest(
                async ([id, name, description, tokenBalanceChange, surveyId, fieldName, startTime, endTime, value]) => {
                    if (value instanceof TokenOptionGroup) {
                        return new EarnBySurveyTokenOption(
                            value,
                            'earn-by-survey',
                            id,
                            name,
                            description,
                            tokenBalanceChange,
                            false,
                            surveyId,
                            fieldName,
                            startTime,
                            endTime
                        );
                    } else {
                        value.name = name;
                        value.description = description;
                        value.tokenBalanceChange = tokenBalanceChange;
                        value.surveyId = surveyId;
                        value.fieldName = fieldName;
                        value.startTime = startTime;
                        value.endTime = endTime;
                        return value;
                    }
                }
            )
            .build();
    }
    public override get type(): string {
        return 'earn-by-survey';
    }
}
