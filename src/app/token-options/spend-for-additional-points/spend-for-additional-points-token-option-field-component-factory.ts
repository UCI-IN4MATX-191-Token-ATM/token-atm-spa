import {
    AssignmentGroupSelectionFormField,
    TokenOptionFieldComponentFactory,
    createAssignmentFieldComponentBuilder,
    createAssignmentGroupComponentBuilder,
    createExcludeTokenOptionsComponentBuilder,
    createFieldComponentWithLabel,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from '../../token-option-field-component-factories/token-option-field-component-factory';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { Injectable, type EnvironmentInjector, type ViewContainerRef, Inject, createComponent } from '@angular/core';
import type { FormField } from 'app/utils/form-field/form-field';
import {
    SpendForAdditionalPointsTokenOptionDataDef,
    type SpendForAdditionalPointsTokenOption,
    type SpendForAdditionalPointsTokenOptionData
} from 'app/token-options/spend-for-additional-points/spend-for-additional-points-token-option';
import { CanvasService } from 'app/services/canvas.service';
import { OptionalFieldComponent } from 'app/components/form-fields/optional-field/optional-field.component';
import { NumberInputFieldComponent } from 'app/components/form-fields/number-input-field/number-input-field.component';
import { FormFieldComponentBuilder } from 'app/utils/form-field/form-field-component-builder';
import { StringInputFieldComponent } from 'app/components/form-fields/string-input-field/string-input-field.component';
import { parseCanvasPercentsAndPoints } from 'app/utils/canvas-grading';
import type { AssignmentGroupMixinData } from 'app/token-options/mixins/assignment-group-mixin';
import type { AssignmentGroup } from 'app/data/assignment-group';

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
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .appendBuilder(
                    createAssignmentFieldComponentBuilder(
                        this.canvasService,
                        environmentInjector,
                        'Canvas Assignment / Quiz to Add Point',
                        ['points', 'percent']
                    )
                )
                .appendBuilder(createAdditionalCanvasScoreComponentBuilder(environmentInjector))
                .appendBuilder(
                    createFieldComponentWithLabel(
                        OptionalFieldComponent<AssignmentGroupSelectionFormField>,
                        'Base max possible points on a Canvas Assignment Group',
                        environmentInjector
                    ).editField((field) => {
                        field.fieldBuilder = createAssignmentGroupComponentBuilder(
                            this.canvasService,
                            environmentInjector
                        );
                    })
                )
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
                        return [
                            value,
                            [courseId, undefined],
                            '',
                            [false, [courseId, undefined]],
                            [false, 1],
                            ['', value.configuration]
                        ];
                    } else {
                        const courseId = value.group.configuration.course.id;
                        // Code to adapt when more than just assignment groups can be selected
                        // const convertedPropNames =
                        //     value.changeMaxPossiblePoints == null
                        //         ? undefined
                        //         : ([
                        //               value.changeMaxPossiblePoints[0],
                        //               {
                        //                   name: value.changeMaxPossiblePoints[1].groupName,
                        //                   id: value.changeMaxPossiblePoints[1].groupId
                        //               }
                        //           ] as [string, AssignmentGroup]);
                        // const maxPointsSelection =
                        //     value.changeMaxPossiblePoints == null
                        //         ? [false, [courseId, convertedPropNames as undefined]]
                        //         : [true, [courseId, convertedPropNames as [string, AssignmentGroup]]];
                        const maxPointsSelection =
                            value.changeMaxPossiblePoints == null
                                ? [false, [courseId, undefined]]
                                : [
                                      true,
                                      [
                                          courseId,
                                          {
                                              name: value.changeMaxPossiblePoints[1].groupName,
                                              id: value.changeMaxPossiblePoints[1].groupId
                                          }
                                      ]
                                  ];
                        return [
                            value,
                            [
                                courseId,
                                {
                                    id: value.assignmentId,
                                    name: value.assignmentName
                                }
                            ],
                            value.additionalScore,
                            maxPointsSelection as [boolean, [string, undefined]] | [boolean, [string, AssignmentGroup]],
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
                        assignmentGroupData,
                        allowedRequestCnt,
                        excludeTokenOptionIds
                    ]) => {
                        const selectionTuple = assignmentGroupData
                            ? ([
                                  'assignment-group',
                                  { groupName: assignmentGroupData.name, groupId: assignmentGroupData.id }
                              ] as [string, AssignmentGroupMixinData])
                            : undefined;
                        return {
                            ...tokenOptionData,
                            type: 'spend-for-additional-points',
                            assignmentName,
                            assignmentId,
                            additionalScore,
                            changeMaxPossiblePoints: selectionTuple,
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
