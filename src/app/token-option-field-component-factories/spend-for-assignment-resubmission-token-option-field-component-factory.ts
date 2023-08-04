import { SpendForAssignmentResubmissionTokenOption } from 'app/token-options/spend-for-assignment-resubmission-token-option';
import {
    TokenOptionFieldComponentFactory,
    createFieldComponentWithLabel,
    createMultipleSectionDateComponentBuilder,
    createNewDueTimeComponentBuilder,
    createStartTimeComponentBuilder,
    tokenOptionFieldComponentBuilder
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
            SpendForAssignmentResubmissionTokenOption,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >
    ] {
        const assignmentField = createFieldComponentWithLabel(
            StringInputFieldComponent,
            'Assignment Name',
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
        return tokenOptionFieldComponentBuilder(environmentInjector)
            .appendBuilder(assignmentField)
            .appendBuilder(createStartTimeComponentBuilder(environmentInjector))
            .appendBuilder(
                createMultipleSectionDateComponentBuilder(
                    () => {
                        return createFieldComponentWithLabel(DateTimeFieldComponent, 'Time', environmentInjector);
                    },
                    'End Time',
                    environmentInjector
                )
            )
            .appendBuilder(
                createMultipleSectionDateComponentBuilder(
                    () => {
                        return createNewDueTimeComponentBuilder(environmentInjector, 'Time');
                    },
                    'New Due Time for Assignment',
                    environmentInjector
                )
            )
            .appendField(new StaticFormField<SpendForAssignmentResubmissionTokenOption | TokenOptionGroup>())
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
                        ],
                        value
                    ];
                } else {
                    return [
                        value,
                        [value.assignmentName, value.group.configuration.course.id],
                        value.startTime,
                        [value.group.configuration.course.id, value.endTime],
                        [value.group.configuration.course.id, value.newDueTime],
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
                    [assignmentName, courseId],
                    startTime,
                    endTime,
                    newDueTime,
                    value
                ]) => {
                    if (value instanceof TokenOptionGroup) {
                        return new SpendForAssignmentResubmissionTokenOption(
                            value,
                            'spend-for-assignment-resubmission',
                            id,
                            name,
                            description,
                            tokenBalanceChange,
                            false,
                            assignmentName,
                            await this.canvasService.getAssignmentIdByName(courseId, assignmentName),
                            startTime,
                            endTime,
                            newDueTime
                        );
                    } else {
                        value.name = name;
                        value.description = description;
                        value.tokenBalanceChange = tokenBalanceChange;
                        value.assignmentName = assignmentName;
                        value.assignmentId = await this.canvasService.getAssignmentIdByName(courseId, assignmentName);
                        value.startTime = startTime;
                        value.endTime = endTime;
                        value.newDueTime = newDueTime;
                        return value;
                    }
                }
            )
            .build();
    }
    public override get type(): string {
        return 'spend-for-assignment-resubmission';
    }
}