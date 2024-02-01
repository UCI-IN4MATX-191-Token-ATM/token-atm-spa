import {
    TokenOptionFieldComponentFactory,
    createAssignmentFieldComponentBuilder,
    createExcludeTokenOptionsComponentBuilder,
    createFieldComponentWithLabel,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from './token-option-field-component-factory';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { Injectable, type EnvironmentInjector, type ViewContainerRef, Inject, createComponent } from '@angular/core';
import type { FormField } from 'app/utils/form-field/form-field';
import {
    SpendForAdditionalPointsTokenOptionDataDef,
    type SpendForAdditionalPointsTokenOption,
    type SpendForAdditionalPointsTokenOptionData
} from 'app/token-options/spend-for-additional-points-token-option';
import { CanvasService } from 'app/services/canvas.service';
import { OptionalFieldComponent } from 'app/components/form-fields/optional-field/optional-field.component';
import { NumberInputFieldComponent } from 'app/components/form-fields/number-input-field/number-input-field.component';
import { FormFieldComponentBuilder } from 'app/utils/form-field/form-field-component-builder';
import { StringInputFieldComponent } from 'app/components/form-fields/string-input-field/string-input-field.component';
import { parseCanvasPercentsAndPoints } from 'app/utils/canvas-grading';
import { StaticFormField } from 'app/utils/form-field/static-form-field';

@Injectable()
export class SpendForAdditionalPointsTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<SpendForAdditionalPointsTokenOption> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            SpendForAdditionalPointsTokenOption | TokenOptionGroup,
            SpendForAdditionalPointsTokenOptionData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >
    ] {
        return tokenOptionValidationWrapper(
            // TODO: Add Validator for Assignment grading type
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .appendBuilder(
                    createPointsOrPercentageAssignmentComponentBuilder(this.canvasService, environmentInjector)
                )
                .appendBuilder(createAdditionalCanvasScoreComponentBuilder(environmentInjector))
                .appendBuilder(
                    createFieldComponentWithLabel(
                        OptionalFieldComponent<NumberInputFieldComponent>,
                        'Allow multiple approved requests',
                        environmentInjector
                    ).editField((field) => {
                        field.fieldBuilder = createFieldComponentWithLabel(
                            NumberInputFieldComponent,
                            'Allowed maximum number of approved requests (-1 for unlimited)',
                            environmentInjector
                        ).editField((field) => {
                            field.validator = async ([x, v]: [NumberInputFieldComponent, number]) => {
                                x.errorMessage = undefined;
                                if (!Number.isInteger(v)) {
                                    x.errorMessage = 'Should be an integer (floating number is not allowed)';
                                    return false;
                                }
                                if (v != -1 && v < 0) {
                                    x.errorMessage = 'Negative number is not allowed (except for -1)';
                                    return false;
                                }
                                return true;
                            };
                        });
                    })
                )
                .appendBuilder(createExcludeTokenOptionsComponentBuilder(environmentInjector))
                .transformSrc((value: SpendForAdditionalPointsTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        const courseId = value.configuration.course.id;
                        return [value, [courseId, [courseId, undefined]], '', [false, 1], ['', value.configuration]];
                    } else {
                        const courseId = value.group.configuration.course.id;
                        return [
                            value,
                            [
                                courseId,
                                [
                                    courseId,
                                    {
                                        id: value.assignmentId,
                                        name: value.assignmentName
                                    }
                                ]
                            ],
                            value.additionalScore,
                            [value.allowedRequestCnt != 1, value.allowedRequestCnt],
                            [value.excludeTokenOptionIds.join(','), value.group.configuration]
                        ];
                    }
                })
                .transformDest(
                    async ([
                        tokenOptionData,
                        { id: assignmentId, name: assignmentName },
                        additionalScore,
                        allowedRequestCnt,
                        excludeTokenOptionIds
                    ]) => {
                        return {
                            ...tokenOptionData,
                            type: 'spend-for-additional-points',
                            assignmentName,
                            assignmentId,
                            additionalScore,
                            allowedRequestCnt: allowedRequestCnt ?? 1,
                            excludeTokenOptionIds
                        };
                    }
                ),
            SpendForAdditionalPointsTokenOptionDataDef.is
        ).build();
    }

    public get type(): string {
        return 'spend-for-additional-points';
    }
}

type AssignmentFormField = FormField<
    [
        string,
        (
            | {
                  id: string;
                  name: string;
              }
            | undefined
        )
    ],
    {
        id: string;
        name: string;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
>;

function createPointsOrPercentageAssignmentComponentBuilder(
    canvasService: CanvasService,
    environmentInjector: EnvironmentInjector
) {
    const assignmentField = createAssignmentFieldComponentBuilder(
        canvasService,
        environmentInjector,
        'Canvas Assignment / Quiz to Add Points'
    );
    return (
        new FormFieldComponentBuilder()
            .setField(new StaticFormField<string>())
            .appendBuilder(assignmentField)
            .appendVP(async (field) => [await field.fieldA.destValue, field.fieldB] as [string, AssignmentFormField])
            .editField((field) => {
                field.validator = async ([courseId, assignmentField]) => {
                    try {
                        const { id, name } = await assignmentField.destValue;
                        const { gradingType } = await canvasService.getAssignmentGradingTypeAndPointsPossible(
                            courseId,
                            id
                        );
                        console.log(id, name, gradingType);
                        if (gradingType === 'percent' || gradingType === 'points') {
                            return true;
                        } else {
                            console.log('Improper Assignment Type!'); // TODO: Have error message actually display
                            assignmentField.errorMessage = `${name} must display its grade as Points or Percentage`;
                        }
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (error: any) {
                        if (error?.message !== 'Invalid data') {
                            throw error;
                        }
                    }
                    return false;
                };
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .transformDest(async ([_, { id, name }]) => {
                return { id, name };
            })
    );
}

export function createAdditionalCanvasScoreComponentBuilder(
    environmentInjector: EnvironmentInjector,
    label = 'Score to Add (number adds points, number followed by ‘%’ adds percentage)',
    shortLabel = 'Added Score'
): FormFieldComponentBuilder<StringInputFieldComponent> {
    return new FormFieldComponentBuilder()
        .setComp(createComponent(StringInputFieldComponent, { environmentInjector: environmentInjector }))
        .editField((field) => {
            field.label = label;
            field.validator = async ([field, value]: [StringInputFieldComponent, string]) => {
                field.errorMessage = undefined;
                const result = parseCanvasPercentsAndPoints(value);
                if (isNaN(result)) {
                    field.errorMessage = `${shortLabel} needs to be a number (e.g, 10.5) or percentage (e.g., 80%).`;
                    return false;
                }
                return true;
            };
        });
}
