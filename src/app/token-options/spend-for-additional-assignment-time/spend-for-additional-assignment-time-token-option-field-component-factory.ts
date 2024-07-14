import {
    SpendForAdditionalAssignmentTimeTokenOptionDataDef,
    type SpendForAdditionalAssignmentTimeTokenOption,
    type SpendForAdditionalAssignmentTimeTokenOptionData
} from './spend-for-additional-assignment-time-token-option';
import {
    TokenOptionFieldComponentFactory,
    createAssignmentFieldComponentBuilder,
    createExcludeTokenOptionsComponentBuilder,
    createOptionalAllowMultipleApprovedRequestsComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from 'app/token-options/token-option-field-component-factory';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { Inject, Injectable, type EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import type { FormField } from 'app/utils/form-field/form-field';
import { CanvasService } from 'app/services/canvas.service';

@Injectable()
export class SpendForAdditionalAssignmentTimeTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<SpendForAdditionalAssignmentTimeTokenOption> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            SpendForAdditionalAssignmentTimeTokenOption | TokenOptionGroup,
            SpendForAdditionalAssignmentTimeTokenOptionData,
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
                        'Canvas Assignment to Add Time to'
                    )
                )
                // TODO: Specific Add Times Component Builder
                .appendBuilder(createOptionalAllowMultipleApprovedRequestsComponentBuilder(environmentInjector))
                .appendBuilder(createExcludeTokenOptionsComponentBuilder(environmentInjector))
                .transformSrc((value: SpendForAdditionalAssignmentTimeTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        const courseId = value.configuration.course.id;
                        return [value, [courseId, undefined], [false, 1], ['', value.configuration]];
                    } else {
                        const courseId = value.group.configuration.course.id;
                        return [
                            value,
                            [
                                courseId,
                                {
                                    id: value.assignmentId,
                                    name: value.assignmentName
                                }
                            ],
                            [value.allowedRequestCnt != 1, value.allowedRequestCnt],
                            [value.excludeTokenOptionIds.join(','), value.group.configuration]
                        ];
                    }
                })
                .transformDest(
                    async ([
                        tokenOptionData,
                        { id: assignmentId, name: assignmentName },
                        allowedRequestCnt,
                        excludeTokenOptionIds
                    ]) => {
                        return {
                            ...tokenOptionData,
                            type: 'spend-for-additional-assignment-time',
                            assignmentName,
                            assignmentId,
                            allowedRequestCnt,
                            excludeTokenOptionIds
                        };
                    }
                ),
            SpendForAdditionalAssignmentTimeTokenOptionDataDef.is
        ).build();
    }

    public get type(): string {
        return 'spend-for-additional-assignment-time';
    }
}
