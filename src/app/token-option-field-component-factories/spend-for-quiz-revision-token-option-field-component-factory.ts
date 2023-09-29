import {
    TokenOptionFieldComponentFactory,
    createEndTimeComponentBuilder,
    createFieldComponentWithLabel,
    createGradeThresholdComponentBuilder,
    createNewDueTimeComponentBuilder,
    createQuizFieldComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from './token-option-field-component-factory';
import { Inject, type EnvironmentInjector, type ViewContainerRef, Injectable } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import { StringInputFieldComponent } from 'app/components/form-fields/string-input-field/string-input-field.component';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
import { CanvasService } from 'app/services/canvas.service';
import { set } from 'date-fns';
import {
    SpendForQuizRevisionTokenOptionDataDef,
    type SpendForQuizRevisionTokenOption,
    type SpendForQuizRevisionTokenOptionData
} from 'app/token-options/spend-for-quiz-revision-token-option';

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
        const assignmentField = createFieldComponentWithLabel(
            StringInputFieldComponent,
            'Canvas Assignment whose Available Until should change',
            environmentInjector
        )
            .appendField(new StaticFormField<string>())
            .editField((field) => {
                field.validator = async (value: typeof field) => {
                    value.fieldA.errorMessage = undefined;
                    const [assignmentName, courseId] = await value.destValue;
                    try {
                        await this.canvasService.getAssignmentIdByName(courseId, assignmentName);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (err: any) {
                        value.fieldA.errorMessage = err.toString();
                        return false;
                    }
                    return true;
                };
            });
        return tokenOptionValidationWrapper(
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .appendBuilder(createQuizFieldComponentBuilder(this.canvasService, environmentInjector))
                .appendBuilder(createGradeThresholdComponentBuilder(environmentInjector))
                .appendBuilder(assignmentField)
                .appendBuilder(createEndTimeComponentBuilder(environmentInjector))
                .appendBuilder(
                    createNewDueTimeComponentBuilder(
                        environmentInjector,
                        'Change Canvas Assignment’s Available Until to'
                    )
                )
                .transformSrc((value: SpendForQuizRevisionTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        return [
                            value,
                            ['', value.configuration.course.id],
                            1,
                            ['', value.configuration.course.id],
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
                            [value.quizName, value.group.configuration.course.id],
                            value.gradeThreshold,
                            [value.assignmentName, value.group.configuration.course.id],
                            value.endTime,
                            value.newDueTime
                        ];
                    }
                })
                .transformDest(
                    async ([
                        tokenOptionData,
                        [quizName, quizCourseId],
                        gradeThreshold,
                        [assignmentName, assignmentCourseId],
                        endTime,
                        newDueTime
                    ]) => {
                        return {
                            ...tokenOptionData,
                            type: 'spend-for-quiz-revision',
                            quizName,
                            quizId: await this.canvasService.getQuizIdByName(quizCourseId, quizName),
                            assignmentName,
                            gradeThreshold,
                            assignmentId: await this.canvasService.getAssignmentIdByName(
                                assignmentCourseId,
                                assignmentName
                            ),
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
