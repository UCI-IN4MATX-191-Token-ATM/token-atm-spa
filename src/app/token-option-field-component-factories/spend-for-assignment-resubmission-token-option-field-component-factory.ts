import {
    SpendForAssignmentResubmissionTokenOption,
    SpendForAssignmentResubmissionTokenOptionData,
    SpendForAssignmentResubmissionTokenOptionDataDef
} from 'app/token-options/spend-for-assignment-resubmission-token-option';
import {
    TokenOptionFieldComponentFactory,
    createAssignmentFieldComponentBuilder,
    createFieldComponentWithLabel,
    createMultipleSectionDateComponentBuilder,
    createNewDueTimeComponentBuilder,
    createStartTimeComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from './token-option-field-component-factory';
import { Inject, type EnvironmentInjector, type ViewContainerRef, Injectable } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import { CanvasService } from 'app/services/canvas.service';
import { set } from 'date-fns';
import { DateTimeFieldComponent } from 'app/components/form-fields/date-time-field/date-time-field.component';

@Injectable()
export class SpendForAssignmentResubmissionTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<SpendForAssignmentResubmissionTokenOption> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            SpendForAssignmentResubmissionTokenOption | TokenOptionGroup,
            SpendForAssignmentResubmissionTokenOptionData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >
    ] {
        return tokenOptionValidationWrapper(
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .appendBuilder(createAssignmentFieldComponentBuilder(this.canvasService, environmentInjector))
                .appendBuilder(createStartTimeComponentBuilder(environmentInjector))
                .appendBuilder(
                    createMultipleSectionDateComponentBuilder(
                        () => {
                            return createFieldComponentWithLabel(
                                DateTimeFieldComponent,
                                'Date/Time',
                                environmentInjector
                            );
                        },
                        'Students Can Request Until',
                        environmentInjector,
                        () =>
                            set(new Date(), {
                                hours: 23,
                                minutes: 59,
                                seconds: 59,
                                milliseconds: 999
                            })
                    )
                )
                .appendBuilder(
                    createMultipleSectionDateComponentBuilder(
                        () => {
                            return createNewDueTimeComponentBuilder(environmentInjector, 'Date/Time');
                        },
                        'Change the Canvas Assignment’s “Available Until” to', // TODO: Phrasing may need more work
                        environmentInjector,
                        () =>
                            set(new Date(), {
                                hours: 23,
                                minutes: 59,
                                seconds: 59,
                                milliseconds: 999
                            })
                    )
                )
                .transformSrc((value: SpendForAssignmentResubmissionTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        return [
                            value,
                            [value.configuration.course.id, undefined],
                            [
                                set(new Date(), {
                                    hours: 0,
                                    minutes: 0,
                                    seconds: 0,
                                    milliseconds: 0
                                }),
                                value.configuration.course.timeZone
                            ],
                            [
                                value.configuration.course.id,
                                value.configuration.course.timeZone,
                                set(new Date(), {
                                    hours: 23,
                                    minutes: 59,
                                    seconds: 59,
                                    milliseconds: 999
                                })
                            ],
                            [
                                value.configuration.course.id,
                                value.configuration.course.timeZone,
                                set(new Date(), {
                                    hours: 23,
                                    minutes: 59,
                                    seconds: 59,
                                    milliseconds: 999
                                })
                            ]
                        ];
                    } else {
                        return [
                            value,
                            [
                                value.group.configuration.course.id,
                                {
                                    id: value.assignmentId,
                                    name: value.assignmentName
                                }
                            ],
                            [value.startTime, value.group.configuration.course.timeZone],
                            [
                                value.group.configuration.course.id,
                                value.group.configuration.course.timeZone,
                                value.endTime
                            ],
                            [
                                value.group.configuration.course.id,
                                value.group.configuration.course.timeZone,
                                value.newDueTime
                            ]
                        ];
                    }
                })
                .transformDest(
                    async ([
                        tokenOptionData,
                        { id: assignmentId, name: assignmentName },
                        startTime,
                        endTime,
                        newDueTime
                    ]) => {
                        return {
                            ...tokenOptionData,
                            type: 'spend-for-assignment-resubmission',
                            assignmentName,
                            assignmentId,
                            startTime,
                            endTime,
                            newDueTime
                        };
                    }
                ),
            SpendForAssignmentResubmissionTokenOptionDataDef.is
        ).build();
    }
    public override get type(): string {
        return 'spend-for-assignment-resubmission';
    }
}
