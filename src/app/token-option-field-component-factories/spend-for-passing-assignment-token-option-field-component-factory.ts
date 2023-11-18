import {
    TokenOptionFieldComponentFactory,
    createAssignmentFieldComponentBuilder,
    createExcludeTokenOptionsComponentBuilder,
    createGradeThresholdComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from './token-option-field-component-factory';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { Injectable, type EnvironmentInjector, type ViewContainerRef, Inject } from '@angular/core';
import type { FormField } from 'app/utils/form-field/form-field';
import {
    SpendForPassingAssignmentTokenOptionDataDef,
    type SpendForPassingAssignmentTokenOption,
    type SpendForPassingAssignmentTokenOptionData
} from 'app/token-options/spend-for-passing-assignment-token-option';
import { CanvasService } from 'app/services/canvas.service';

@Injectable()
export class SpendForPassingAssignmentTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<SpendForPassingAssignmentTokenOption> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            SpendForPassingAssignmentTokenOption | TokenOptionGroup,
            SpendForPassingAssignmentTokenOptionData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >
    ] {
        return tokenOptionValidationWrapper(
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .appendBuilder(
                    createAssignmentFieldComponentBuilder(
                        this.canvasService,
                        environmentInjector,
                        'Canvas Assignment / Quiz'
                    )
                )
                .appendBuilder(createGradeThresholdComponentBuilder(environmentInjector, 'Grade Threshold'))
                .appendBuilder(createExcludeTokenOptionsComponentBuilder(environmentInjector))
                .transformSrc((value: SpendForPassingAssignmentTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup)
                        return [value, [value.configuration.course.id, undefined], 1, ['', value.configuration]];
                    else
                        return [
                            value,
                            [
                                value.group.configuration.course.id,
                                {
                                    id: value.assignmentId,
                                    name: value.assignmentName
                                }
                            ],
                            value.gradeThreshold,
                            [value.excludeTokenOptionIds.join(','), value.group.configuration]
                        ];
                })
                .transformDest(
                    async ([
                        tokenOptionData,
                        { id: assignmentId, name: assignmentName },
                        gradeThreshold,
                        excludeTokenOptionIds
                    ]) => {
                        return {
                            ...tokenOptionData,
                            type: 'spend-for-passing-assignment',
                            assignmentName,
                            assignmentId,
                            gradeThreshold,
                            excludeTokenOptionIds
                        };
                    }
                ),
            SpendForPassingAssignmentTokenOptionDataDef.is
        ).build();
    }

    public get type(): string {
        return 'spend-for-passing-assignment';
    }
}
