import {
    EarnByQuizTokenOptionDataDef,
    type EarnByQuizTokenOption,
    type EarnByQuizTokenOptionData
} from 'app/token-options/earn-by-quiz/earn-by-quiz-token-option';
import {
    TokenOptionFieldComponentFactory,
    createGradeThresholdComponentBuilder,
    createQuizFieldComponentBuilder,
    createStartTimeComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from '../../token-option-field-component-factories/token-option-field-component-factory';
import { Inject, type EnvironmentInjector, type ViewContainerRef, Injectable } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import { CanvasService } from 'app/services/canvas.service';
import { set } from 'date-fns';

@Injectable()
export class EarnByQuizTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<EarnByQuizTokenOption> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        FormField<EarnByQuizTokenOption | TokenOptionGroup, EarnByQuizTokenOptionData, any>
    ] {
        return tokenOptionValidationWrapper(
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .appendBuilder(createQuizFieldComponentBuilder(this.canvasService, environmentInjector))
                .appendBuilder(createStartTimeComponentBuilder(environmentInjector))
                .appendBuilder(createGradeThresholdComponentBuilder(environmentInjector))
                .transformSrc((value: EarnByQuizTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        return [
                            value,
                            [value.configuration.course.id, undefined],
                            set(new Date(), {
                                hours: 0,
                                minutes: 0,
                                seconds: 0,
                                milliseconds: 0
                            }),
                            1
                        ];
                    } else {
                        return [
                            value,
                            [
                                value.group.configuration.course.id,
                                {
                                    id: value.quizId,
                                    name: value.quizName
                                }
                            ],
                            value.startTime,
                            value.gradeThreshold
                        ];
                    }
                })
                .transformDest(async ([tokenOptionData, { id: quizId, name: quizName }, startTime, gradeThreshold]) => {
                    return {
                        ...tokenOptionData,
                        type: 'earn-by-quiz',
                        quizName,
                        quizId,
                        startTime,
                        gradeThreshold
                    };
                }),
            EarnByQuizTokenOptionDataDef.is
        ).build();
    }
    public override get type(): string {
        return 'earn-by-quiz';
    }
}
