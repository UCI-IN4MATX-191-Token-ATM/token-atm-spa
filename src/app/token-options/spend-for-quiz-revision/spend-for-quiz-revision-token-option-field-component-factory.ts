import {
    TokenOptionFieldComponentFactory,
    createAssignmentFieldComponentBuilder,
    createEndTimeComponentBuilder,
    createGradeThresholdComponentBuilder,
    createNewDueTimeComponentBuilder,
    createQuizFieldComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from '../token-option-field-component-factory';
import { Inject, type EnvironmentInjector, type ViewContainerRef, Injectable } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import { CanvasService } from 'app/services/canvas.service';
import { set } from 'date-fns';
import {
    SpendForQuizRevisionTokenOptionDataDef,
    type SpendForQuizRevisionTokenOption,
    type SpendForQuizRevisionTokenOptionData
} from 'app/token-options/spend-for-quiz-revision/spend-for-quiz-revision-token-option';

@Injectable()
export class SpendForQuizRevisionTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<SpendForQuizRevisionTokenOption> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            SpendForQuizRevisionTokenOption | TokenOptionGroup,
            SpendForQuizRevisionTokenOptionData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >
    ] {
        return tokenOptionValidationWrapper(
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .appendBuilder(createQuizFieldComponentBuilder(this.canvasService, environmentInjector))
                .appendBuilder(createGradeThresholdComponentBuilder(environmentInjector))
                .appendBuilder(
                    createAssignmentFieldComponentBuilder(
                        this.canvasService,
                        environmentInjector,
                        'Canvas Assignment whose “Available Until” should change'
                    )
                )
                .appendBuilder(createEndTimeComponentBuilder(environmentInjector))
                .appendBuilder(
                    createNewDueTimeComponentBuilder(
                        environmentInjector,
                        'Change Canvas Assignment’s “Available Until” to'
                    )
                )
                .transformSrc((value: SpendForQuizRevisionTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        return [
                            value,
                            [value.configuration.course.id, undefined],
                            1,
                            [value.configuration.course.id, undefined],
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
                            })
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
                            value.gradeThreshold,
                            [
                                value.group.configuration.course.id,
                                {
                                    id: value.assignmentId,
                                    name: value.assignmentName
                                }
                            ],
                            value.endTime,
                            value.newDueTime
                        ];
                    }
                })
                .transformDest(
                    async ([
                        tokenOptionData,
                        { id: quizId, name: quizName },
                        gradeThreshold,
                        { id: assignmentId, name: assignmentName },
                        endTime,
                        newDueTime
                    ]) => {
                        return {
                            ...tokenOptionData,
                            type: 'spend-for-quiz-revision',
                            quizName,
                            quizId,
                            assignmentName,
                            gradeThreshold,
                            assignmentId,
                            endTime,
                            newDueTime
                        };
                    }
                ),
            SpendForQuizRevisionTokenOptionDataDef.is
        ).build();
    }
    public override get type(): string {
        return 'spend-for-quiz-revision';
    }
}
