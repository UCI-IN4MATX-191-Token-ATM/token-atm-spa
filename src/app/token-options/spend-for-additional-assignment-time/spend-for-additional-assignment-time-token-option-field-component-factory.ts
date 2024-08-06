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
import type { FormField, ObservableFormField } from 'app/utils/form-field/form-field';
import { CanvasService } from 'app/services/canvas.service';
import { OptionalFieldComponent } from 'app/components/form-fields/optional-field/optional-field.component';
import { FormFieldComponentBuilder } from 'app/utils/form-field/form-field-component-builder';
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
                    ).editField((field) => {
                        field.fieldBuilder = createRemoveOrAddDurationSwitchComponent(
                            'Change Date/Time By',
                            environmentInjector
                        );
                    })
                )
                .appendBuilder(
                    createFieldComponentWithLabel(
                        OptionalFieldComponent<AdditionalTimeSwitchComponent>,
                        'Change ‘Due’',
                        environmentInjector
                    ).editField((field) => {
                        field.fieldBuilder = createRemoveOrAddDurationSwitchComponent(
                            'Change Date/Time By',
                            environmentInjector
                        );
                    })
                )
                .appendBuilder(
                    createFieldComponentWithLabel(
                        OptionalFieldComponent<AdditionalTimeSwitchComponent>,
                        'Change ‘Available Until’',
                        environmentInjector
                    ).editField((field) => {
                        field.fieldBuilder = createRemoveOrAddDurationSwitchComponent(
                            'Change Date/Time By',
                            environmentInjector
                        );
                    })
                )
                .appendBuilder(createOptionalAllowMultipleApprovedRequestsComponentBuilder(environmentInjector))
                .appendBuilder(createExcludeTokenOptionsComponentBuilder(environmentInjector))
                .transformSrc((value: SpendForAdditionalAssignmentTimeTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        const courseId = value.configuration.course.id;
                        return [
                            value,
                            [courseId, undefined],
                            changeDateTransform(undefined),
                            changeDateTransform(undefined),
                            changeDateTransform(undefined),
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
                            changeDateTransform(value.unlockAtChange),
                            changeDateTransform(value.dueAtChange),
                            changeDateTransform(value.lockAtChange),
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
                        allowedRequestCnt,
                        excludeTokenOptionIds
                    ]) => {
                        return {
                            ...tokenOptionData,
                            type: 'spend-for-additional-assignment-time',
                            assignmentName,
                            unlockAtChange: unlockAtChange?.[1],
                            dueAtChange: dueAtChange?.[1],
                            lockAtChange: lockAtChange?.[1],
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

type extractBuiltType<T> = T extends FormFieldComponentBuilder<infer U> ? U : never;
type AdditionalTimeSwitchComponent = extractBuiltType<ReturnType<typeof createRemoveOrAddDurationSwitchComponent>>;

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
type SwitchDestType = ['Removing It', null] | ['Adjusting the Time', NonNullable<ChangeDatesType>];
function changeDateTransform(x: ChangeDatesType): [boolean, SwitchDestType] {
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
    ).wrapSuffix(
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
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                new FormFieldComponentBuilder().setField(new StaticFormField<null>()).transformDest(async (_v) => {
                    return null;
                })
            );
            field.addField('Adjusting the Time', createDurationListComponent('', environmentInjector));
        })
    );
}
