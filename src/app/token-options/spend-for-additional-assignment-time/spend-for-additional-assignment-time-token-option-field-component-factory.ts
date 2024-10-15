import {
    SpendForAdditionalAssignmentTimeTokenOptionDataDef,
    type SpendForAdditionalAssignmentTimeTokenOption,
    type SpendForAdditionalAssignmentTimeTokenOptionData
} from './spend-for-additional-assignment-time-token-option';
import {
    TokenOptionFieldComponentFactory,
    createAssignmentFieldComponentBuilder,
    createExcludeTokenOptionsComponentBuilder,
    createFieldComponentWithLabel,
    createOptionalAllowMultipleApprovedRequestsComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from 'app/token-options/token-option-field-component-factory';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { Inject, Injectable, type EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import type { ExtractSrc, FormField, ObservableFormField } from 'app/utils/form-field/form-field';
import { CanvasService } from 'app/services/canvas.service';
import { OptionalFieldComponent } from 'app/components/form-fields/optional-field/optional-field.component';
import { FormFieldComponentBuilder, type ExtractBuiltType } from 'app/utils/form-field/form-field-component-builder';
import {
    AdditionalDurationFieldComponent,
    type SingleDurationResult
} from 'app/components/form-fields/additional-duration-field/additional-duration-field.component';
import type { DirectFormField } from 'app/utils/form-field/direct-form-field';
import { DurationFieldComponent } from 'app/components/form-fields/duration-field/duration-field.component';
import type { ChangeAssignmentDatesMixinData } from '../mixins/change-assignment-dates-mixin';
import { SwitchFieldComponent } from 'app/components/form-fields/switch-field/switch-field.component';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
import { SingleSelectionFieldComponent } from 'app/components/form-fields/selection-fields/single-selection-field/single-selection-field.component';

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
                .appendBuilder(
                    createFieldComponentWithLabel(
                        OptionalFieldComponent<AdditionalTimeSwitchComponent>,
                        'Change ‘Available From’',
                        environmentInjector
                    )
                        .editField((field) => {
                            field.fieldBuilder = createRemoveOrAddDurationSwitchComponent(
                                'Change Date/Time By',
                                environmentInjector
                            );
                        })
                        .transformSrc((v: ChangeDatesType) => {
                            return optionalChangeDateSrcTransform(v);
                        })
                )
                .appendBuilder(
                    createFieldComponentWithLabel(
                        OptionalFieldComponent<AdditionalTimeSwitchComponent>,
                        'Change ‘Due Date’',
                        environmentInjector
                    )
                        .editField((field) => {
                            field.fieldBuilder = createRemoveOrAddDurationSwitchComponent(
                                'Change Date/Time By',
                                environmentInjector
                            );
                        })
                        .transformSrc((v: ChangeDatesType) => {
                            return optionalChangeDateSrcTransform(v);
                        })
                )
                .appendBuilder(
                    createFieldComponentWithLabel(
                        OptionalFieldComponent<AdditionalTimeSwitchComponent>,
                        'Change ‘Available Until’',
                        environmentInjector
                    )
                        .editField((field) => {
                            field.fieldBuilder = createRemoveOrAddDurationSwitchComponent(
                                'Change Date/Time By',
                                environmentInjector
                            );
                        })
                        .transformSrc((v: ChangeDatesType) => {
                            return optionalChangeDateSrcTransform(v);
                        })
                )
                .appendBuilder(createDateConflictHandlerSelection('Handle Date Conflicts by', environmentInjector))
                .appendBuilder(createOptionalAllowMultipleApprovedRequestsComponentBuilder(environmentInjector))
                .appendBuilder(createExcludeTokenOptionsComponentBuilder(environmentInjector))
                .transformSrc((value: SpendForAdditionalAssignmentTimeTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        const courseId = value.configuration.course.id;
                        return [
                            value,
                            [courseId, undefined],
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            [false, 1],
                            ['', value.configuration]
                        ];
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
                            value.unlockAtChange,
                            value.dueAtChange,
                            value.lockAtChange,
                            value.dateConflict,
                            [value.allowedRequestCnt != 1, value.allowedRequestCnt],
                            [value.excludeTokenOptionIds.join(','), value.group.configuration]
                        ];
                    }
                })
                .transformDest(
                    async ([
                        tokenOptionData,
                        { id: assignmentId, name: assignmentName },
                        unlockAtChange,
                        dueAtChange,
                        lockAtChange,
                        dateConflict,
                        allowedRequestCnt,
                        excludeTokenOptionIds
                    ]) => {
                        const handleConflict: typeof dateConflict | undefined = dateConflict;
                        return {
                            ...tokenOptionData,
                            type: 'spend-for-additional-assignment-time',
                            assignmentName,
                            unlockAtChange,
                            dueAtChange,
                            lockAtChange,
                            dateConflict: handleConflict,
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

type AdditionalTimeSwitchComponent = ExtractBuiltType<ReturnType<typeof createRemoveOrAddDurationSwitchComponent>>;

function createAdditionalAssignmentDurationComponent(
    durationFieldBuilderFactory: () => FormFieldComponentBuilder<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        DirectFormField<SingleDurationResult, any>
    >,
    label: string,
    environmentInjector: EnvironmentInjector,
    defaultDurationValueProvider?: () => SingleDurationResult
): FormFieldComponentBuilder<AdditionalDurationFieldComponent> {
    return createFieldComponentWithLabel(AdditionalDurationFieldComponent, label, environmentInjector).editField(
        (field) => {
            field.durationFieldBuilderFactory = durationFieldBuilderFactory;
            if (defaultDurationValueProvider) field.defaultDurationValueProvider = defaultDurationValueProvider;
        }
    );
}

type ChangeDatesType = ChangeAssignmentDatesMixinData['dueAtChange'];
type OpSwitchSrc = ExtractSrc<ExtractBuiltType<ReturnType<typeof createRemoveOrAddDurationSwitchComponent>>>;
function optionalChangeDateSrcTransform(x: ChangeDatesType): [boolean, OpSwitchSrc] {
    return [x === undefined ? false : true, x === null ? ['Removing It', x] : ['Adjusting the Time', x ?? {}]];
}

function createDurationListComponent(label: string, environmentInjector: EnvironmentInjector) {
    return createAdditionalAssignmentDurationComponent(
        () => createFieldComponentWithLabel(DurationFieldComponent, '', environmentInjector),
        label,
        environmentInjector
    );
}

function createRemoveOrAddDurationSwitchComponent(label: string, environmentInjector: EnvironmentInjector) {
    return (
        createFieldComponentWithLabel(
            SingleSelectionFieldComponent<'Removing It' | 'Adjusting the Time'>,
            label,
            environmentInjector
        )
            .editField((field) => {
                field.validator = async ([v, f]: ['Removing It' | 'Adjusting the Time' | undefined, typeof field]) => {
                    f.errorMessage = undefined;
                    if (v === undefined) {
                        f.errorMessage = 'Please select the change you want to make.';
                        return false;
                    }
                    return true;
                };
            })
            .transformObservableSrc((v: 'Removing It' | 'Adjusting the Time') => [
                v,
                async () => ['Removing It', 'Adjusting the Time']
            ]) as FormFieldComponentBuilder<
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            DirectFormField<'Removing It' | 'Adjusting the Time' | undefined, any> &
                ObservableFormField<'Removing It' | 'Adjusting the Time' | undefined>
        >
    )
        .wrapSuffix(
            createFieldComponentWithLabel(
                SwitchFieldComponent<
                    'Removing It' | 'Adjusting the Time',
                    { 'Removing It': null; 'Adjusting the Time': ChangeDatesType },
                    { 'Removing It': null; 'Adjusting the Time': ChangeDatesType }
                >,
                '',
                environmentInjector
            ).editField((field) => {
                field.addField(
                    'Removing It',
                    new FormFieldComponentBuilder()
                        .setField(new StaticFormField<null>())
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        .transformDest(async (_v) => {
                            return null;
                        })
                );
                field.addField('Adjusting the Time', createDurationListComponent('', environmentInjector));
            })
        )
        .transformDest(async ([, result]) => {
            return result;
        });
}

function createDateConflictHandlerSelection(label: string, environmentInjector: EnvironmentInjector) {
    const CONSTRAIN_TEXT = 'Keeping ‘Due’ date between ‘From’ and ‘Until’ dates';
    const EXTEND_TEXT = 'Extending ‘Until’, or ‘From’, date to match ‘Due’ date';
    return createFieldComponentWithLabel(SingleSelectionFieldComponent<string>, label, environmentInjector)
        .editField((field) => {
            field.validator = async ([v, field]: [string | undefined, SingleSelectionFieldComponent<string>]) => {
                field.errorMessage = undefined;
                if (v == null) {
                    field.errorMessage = 'Please select a way to handle Date conflicts.';
                    return false;
                }
                return true;
            };
        })
        .transformSrc((handleBy: 'constrain' | 'extend' | undefined) => [
            handleBy === 'constrain' ? CONSTRAIN_TEXT : handleBy === 'extend' ? EXTEND_TEXT : undefined,
            async () => [CONSTRAIN_TEXT, EXTEND_TEXT]
        ])
        .transformDest(async (selection) => {
            if (selection === CONSTRAIN_TEXT) {
                return 'constrain';
            } else if (selection === EXTEND_TEXT) {
                return 'extend';
            } else {
                throw new Error('Invalid data');
            }
        });
}
