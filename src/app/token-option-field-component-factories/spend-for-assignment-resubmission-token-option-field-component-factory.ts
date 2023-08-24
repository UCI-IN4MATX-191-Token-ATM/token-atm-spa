import {
    SpendForAssignmentResubmissionTokenOption,
    SpendForAssignmentResubmissionTokenOptionData,
    SpendForAssignmentResubmissionTokenOptionDataDef
} from 'app/token-options/spend-for-assignment-resubmission-token-option';
import {
    TokenOptionFieldComponentFactory,
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
import { StringInputFieldComponent } from 'app/components/form-fields/string-input-field/string-input-field.component';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
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
        const assignmentField = createFieldComponentWithLabel(
            StringInputFieldComponent,
            'Canvas Assignment Name',
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
                .appendBuilder(assignmentField)
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
                        'Token ATM Request Available Until',
                        environmentInjector
                    )
                )
                .appendBuilder(
                    createMultipleSectionDateComponentBuilder(
                        () => {
                            return createNewDueTimeComponentBuilder(environmentInjector, 'Date/Time');
                        },
                        'New Until Date/Time for Canvas Assignment',
                        environmentInjector
                    )
                )
                .transformSrc((value: SpendForAssignmentResubmissionTokenOption | TokenOptionGroup) => {
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
                            [
                                value.configuration.course.id,
                                set(new Date(), {
                                    hours: 23,
                                    minutes: 59,
                                    seconds: 59,
                                    milliseconds: 999
                                })
                            ],
                            [
                                value.configuration.course.id,
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
                            [value.assignmentName, value.group.configuration.course.id],
                            value.startTime,
                            [value.group.configuration.course.id, value.endTime],
                            [value.group.configuration.course.id, value.newDueTime]
                        ];
                    }
                })
                .transformDest(
                    async ([tokenOptionData, [assignmentName, courseId], startTime, endTime, newDueTime]) => {
                        return {
                            ...tokenOptionData,
                            type: 'spend-for-assignment-resubmission',
                            assignmentName,
                            assignmentId: await this.canvasService.getAssignmentIdByName(courseId, assignmentName),
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
