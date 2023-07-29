import {
    TokenOptionFieldComponentFactory,
    createEndTimeComponentBuilder,
    createExcludeTokenOptionsComponentBuilder,
    createNewDueTimeComponentBuilder,
    createQuizFieldComponentBuilder,
    createStartTimeComponentBuilder,
    tokenOptionFieldComponentBuilder
} from './token-option-field-component-factory';
import { Inject, type EnvironmentInjector, type ViewContainerRef, Injectable } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
import { CanvasService } from 'app/services/canvas.service';
import { set } from 'date-fns';
import { SpendForLabDataTokenOption } from 'app/token-options/spend-for-lab-data-token-option';

@Injectable()
export class SpendForLabDataTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<SpendForLabDataTokenOption> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            SpendForLabDataTokenOption | TokenOptionGroup,
            SpendForLabDataTokenOption,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >
    ] {
        return tokenOptionFieldComponentBuilder(environmentInjector)
            .appendBuilder(createQuizFieldComponentBuilder(this.canvasService, environmentInjector))
            .appendBuilder(createStartTimeComponentBuilder(environmentInjector))
            .appendBuilder(createEndTimeComponentBuilder(environmentInjector))
            .appendBuilder(createNewDueTimeComponentBuilder(environmentInjector, 'New Due Time for Lab Data Quiz'))
            .appendBuilder(createExcludeTokenOptionsComponentBuilder(environmentInjector))
            .appendField(new StaticFormField<SpendForLabDataTokenOption | TokenOptionGroup>())
            .transformSrc((value: SpendForLabDataTokenOption | TokenOptionGroup) => {
                if (value instanceof TokenOptionGroup) {
                    return [
                        value,
                        ['', value.configuration.course.id],
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
                        set(new Date(), {
                            hours: 23,
                            minutes: 59,
                            seconds: 59,
                            milliseconds: 999
                        }),
                        ['', value.configuration],
                        value
                    ];
                } else {
                    return [
                        value,
                        [value.quizName, value.group.configuration.course.id],
                        value.startTime,
                        value.endTime,
                        value.newDueTime,
                        [value.excludeTokenOptionIds.join(','), value.group.configuration],
                        value
                    ];
                }
            })
            .transformDest(
                async ([
                    id,
                    name,
                    description,
                    tokenBalanceChange,
                    [quizName, courseId],
                    startTime,
                    endTime,
                    newDueTime,
                    excludeTokenOptionIds,
                    value
                ]) => {
                    if (value instanceof TokenOptionGroup) {
                        return new SpendForLabDataTokenOption(
                            value,
                            'spend-for-lab-data',
                            id,
                            name,
                            description,
                            tokenBalanceChange,
                            false,
                            quizName,
                            await this.canvasService.getQuizIdByName(courseId, quizName),
                            startTime,
                            endTime,
                            newDueTime,
                            excludeTokenOptionIds
                        );
                    } else {
                        value.name = name;
                        value.description = description;
                        value.tokenBalanceChange = tokenBalanceChange;
                        value.quizName = quizName;
                        value.quizId = await this.canvasService.getQuizIdByName(courseId, quizName);
                        value.startTime = startTime;
                        value.endTime = endTime;
                        value.newDueTime = newDueTime;
                        value.excludeTokenOptionIds = excludeTokenOptionIds;
                        return value;
                    }
                }
            )
            .build();
    }
    public override get type(): string {
        return 'spend-for-lab-data';
    }
}
