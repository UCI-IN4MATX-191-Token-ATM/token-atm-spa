import { EarnByQuizTokenOption } from 'app/token-options/earn-by-quiz-token-option';
import {
    TokenOptionFieldComponentFactory,
    createGradeThresholdComponentBuilder,
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

@Injectable()
export class EarnByQuizTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<EarnByQuizTokenOption> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        FormField<EarnByQuizTokenOption | TokenOptionGroup, EarnByQuizTokenOption, any>
    ] {
        return tokenOptionFieldComponentBuilder(environmentInjector)
            .appendBuilder(createQuizFieldComponentBuilder(this.canvasService, environmentInjector))
            .appendBuilder(createStartTimeComponentBuilder(environmentInjector))
            .appendBuilder(createGradeThresholdComponentBuilder(environmentInjector))
            .appendField(new StaticFormField<EarnByQuizTokenOption | TokenOptionGroup>())
            .transformSrc((value: EarnByQuizTokenOption | TokenOptionGroup) => {
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
                        1,
                        value
                    ];
                } else {
                    return [
                        value,
                        [value.quizName, value.group.configuration.course.id],
                        value.startTime,
                        value.gradeThreshold,
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
                    gradeThreshold,
                    value
                ]) => {
                    if (value instanceof TokenOptionGroup) {
                        return new EarnByQuizTokenOption(
                            value,
                            'earn-by-quiz',
                            id,
                            name,
                            description,
                            tokenBalanceChange,
                            false,
                            quizName,
                            await this.canvasService.getQuizIdByName(courseId, quizName),
                            startTime,
                            gradeThreshold
                        );
                    } else {
                        value.name = name;
                        value.description = description;
                        value.tokenBalanceChange = tokenBalanceChange;
                        value.quizName = quizName;
                        value.quizId = await this.canvasService.getQuizIdByName(courseId, quizName);
                        value.startTime = startTime;
                        value.gradeThreshold = gradeThreshold;
                        return value;
                    }
                }
            )
            .build();
    }
    public override get type(): string {
        return 'earn-by-quiz';
    }
}
