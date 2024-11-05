import {
    type PlaceholderTokenOption,
    type PlaceholderTokenOptionData,
    PlaceholderTokenOptionDataDef
} from 'app/token-options/placeholder-token-option/placeholder-token-option';
import {
    TokenOptionFieldComponentFactory,
    createExcludeTokenOptionsComponentBuilder,
    createFieldComponentWithLabel,
    createMultipleSectionDateComponentBuilder,
    createOptionalAllowMultipleApprovedRequestsComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from '../token-option-field-component-factory';
import { type ViewContainerRef, type EnvironmentInjector, Injectable } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import { set } from 'date-fns';
import { DateTimeFieldComponent } from 'app/components/form-fields/date-time-field/date-time-field.component';
import { OptionalFieldComponent } from 'app/components/form-fields/optional-field/optional-field.component';
import type { MultipleSectionDateFieldComponent } from 'app/components/form-fields/multiple-section-date-field/multiple-section-date-field.component';

@Injectable()
export class PlaceholderTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<PlaceholderTokenOption> {
    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            PlaceholderTokenOption | TokenOptionGroup,
            PlaceholderTokenOptionData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >
    ] {
        return tokenOptionValidationWrapper(
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .appendBuilder(
                    createFieldComponentWithLabel(
                        OptionalFieldComponent<MultipleSectionDateFieldComponent>,
                        'Specify when students can start submitting requests',
                        environmentInjector
                    ).editField((field) => {
                        field.fieldBuilder = createMultipleSectionDateComponentBuilder(
                            () => {
                                return createFieldComponentWithLabel(
                                    DateTimeFieldComponent,
                                    'Date/Time',
                                    environmentInjector
                                );
                            },
                            'Students Can Request From',
                            environmentInjector,
                            () =>
                                set(new Date(), {
                                    hours: 0,
                                    minutes: 0,
                                    seconds: 0,
                                    milliseconds: 0
                                })
                        );
                    })
                )
                .appendBuilder(
                    createFieldComponentWithLabel(
                        OptionalFieldComponent<MultipleSectionDateFieldComponent>,
                        'Specify when students can no longer submit requests',
                        environmentInjector
                    ).editField((field) => {
                        field.fieldBuilder = createMultipleSectionDateComponentBuilder(
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
                        );
                    })
                )
                .appendBuilder(createOptionalAllowMultipleApprovedRequestsComponentBuilder(environmentInjector))
                .appendBuilder(createExcludeTokenOptionsComponentBuilder(environmentInjector))
                .transformSrc((value: PlaceholderTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        return [
                            value,
                            [
                                false,
                                [
                                    value.configuration.course.id,
                                    set(new Date(), {
                                        hours: 0,
                                        minutes: 0,
                                        seconds: 0,
                                        milliseconds: 0
                                    }),
                                    value.configuration.course.timeZone
                                ]
                            ],
                            [
                                false,
                                [
                                    value.configuration.course.id,
                                    set(new Date(), {
                                        hours: 23,
                                        minutes: 59,
                                        seconds: 59,
                                        milliseconds: 999
                                    }),
                                    value.configuration.course.timeZone
                                ]
                            ],
                            [false, 1],
                            ['', value.configuration]
                        ];
                    } else {
                        return [
                            value,
                            [
                                value.startTime !== null,
                                [
                                    value.group.configuration.course.id,
                                    value.startTime ??
                                        set(new Date(), {
                                            hours: 0,
                                            minutes: 0,
                                            seconds: 0,
                                            milliseconds: 0
                                        }),
                                    value.group.configuration.course.timeZone
                                ]
                            ],
                            [
                                value.endTime !== null,
                                [
                                    value.group.configuration.course.id,
                                    value.endTime ??
                                        set(new Date(), {
                                            hours: 23,
                                            minutes: 59,
                                            seconds: 59,
                                            milliseconds: 999
                                        }),
                                    value.group.configuration.course.timeZone
                                ]
                            ],
                            [value.allowedRequestCnt != 1, value.allowedRequestCnt],
                            [value.excludeTokenOptionIds.join(','), value.group.configuration]
                        ];
                    }
                })
                .transformDest(
                    async ([tokenOptionData, startTime, endTime, allowedRequestCnt, excludeTokenOptionIds]) => {
                        return {
                            ...tokenOptionData,
                            type: 'placeholder-token-option',
                            startTime: startTime ?? null,
                            endTime: endTime ?? null,
                            allowedRequestCnt,
                            excludeTokenOptionIds
                        };
                    }
                ),
            PlaceholderTokenOptionDataDef.is
        ).build();
    }
    public override get type(): string {
        return 'placeholder-token-option';
    }
}
