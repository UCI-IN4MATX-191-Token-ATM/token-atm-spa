import {
    TokenOptionFieldComponentFactory,
    createEndTimeComponentBuilder,
    createExcludeTokenOptionsComponentBuilder,
    createNewDueTimeComponentBuilder,
    createQuizFieldComponentBuilder,
    createStartTimeComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from './token-option-field-component-factory';
import { Inject, type EnvironmentInjector, type ViewContainerRef, Injectable } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import { CanvasService } from 'app/services/canvas.service';
import { set } from 'date-fns';
import {
    SpendForLabDataTokenOptionDataDef,
    type SpendForLabDataTokenOption,
    type SpendForLabDataTokenOptionData
} from 'app/token-options/spend-for-lab-data-token-option';

@Injectable()
export class SpendForLabDataTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<SpendForLabDataTokenOption> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            SpendForLabDataTokenOption | TokenOptionGroup,
            SpendForLabDataTokenOptionData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >
    ] {
        return tokenOptionValidationWrapper(
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .appendBuilder(createQuizFieldComponentBuilder(this.canvasService, environmentInjector))
                .appendBuilder(createStartTimeComponentBuilder(environmentInjector))
                .appendBuilder(createEndTimeComponentBuilder(environmentInjector))
                .appendBuilder(createNewDueTimeComponentBuilder(environmentInjector, 'New Due Time for Lab Data Quiz'))
                .appendBuilder(createExcludeTokenOptionsComponentBuilder(environmentInjector))
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
                            ['', value.configuration]
                        ];
                    } else {
                        return [
                            value,
                            [value.quizName, value.group.configuration.course.id],
                            value.startTime,
                            value.endTime,
                            value.newDueTime,
                            [value.excludeTokenOptionIds.join(','), value.group.configuration]
                        ];
                    }
                })
                .transformDest(
                    async ([
                        tokenOptionData,
                        [quizName, courseId],
                        startTime,
                        endTime,
                        newDueTime,
                        excludeTokenOptionIds
                    ]) => {
                        return {
                            ...tokenOptionData,
                            type: 'spend-for-lab-data',
                            quizName,
                            quizId: await this.canvasService.getQuizIdByName(courseId, quizName),
                            startTime,
                            endTime,
                            newDueTime,
                            excludeTokenOptionIds
                        };
                    }
                ),
            SpendForLabDataTokenOptionDataDef.is
        ).build();
    }
    public override get type(): string {
        return 'spend-for-lab-data';
    }
}
