import { createComponent, Type, EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import { DateTimeFieldComponent } from 'app/components/form-fields/date-time-field/date-time-field.component';
import { ErrorMessageFieldComponent } from 'app/components/form-fields/error-message-field/error-message-field.component';
import { MultipleSectionDateFieldComponent } from 'app/components/form-fields/multiple-section-date-field/multiple-section-date-field.component';
import { NumberInputFieldComponent } from 'app/components/form-fields/number-input-field/number-input-field.component';
import { SingleSelectionFieldComponent } from 'app/components/form-fields/selection-fields/single-selection-field/single-selection-field.component';
import { StringInputFieldComponent } from 'app/components/form-fields/string-input-field/string-input-field.component';
import { StringTextareaFieldComponent } from 'app/components/form-fields/string-textarea-field/string-textarea-field.component';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { CanvasService } from 'app/services/canvas.service';
import type { ExtractDataType, TokenOption, TokenOptionData } from 'app/token-options/token-option';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';
import type { ExtractDest, ExtractSrc, FormField } from 'app/utils/form-field/form-field';
import type { FormFieldAppender } from 'app/utils/form-field/form-field-appender';
import { FormFieldComponentBuilder, TupleAppend } from 'app/utils/form-field/form-field-component-builder';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
import { unwrapValidation } from 'app/utils/validation-unwrapper';
import { compareDesc, set } from 'date-fns';
import * as t from 'io-ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class TokenOptionFieldComponentFactory<T extends TokenOption<any>> {
    public abstract create(
        environmentInjector: EnvironmentInjector
    ): // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [(viewContainerRef: ViewContainerRef) => void, FormField<T | TokenOptionGroup, ExtractDataType<T>, any>];
    public abstract get type(): string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createFieldComponentWithLabel<T extends FormField<any, any, any>>(
    fieldType: Type<T>,
    label: string,
    environmentInjector: EnvironmentInjector
): FormFieldComponentBuilder<T> {
    return new FormFieldComponentBuilder()
        .setComp(createComponent(fieldType, { environmentInjector: environmentInjector }))
        .editField((field) => {
            field.label = label;
        });
}

export function createIdFieldComponentBuilder(
    environmentInjector: EnvironmentInjector
): FormFieldComponentBuilder<FormField<number, number, [NumberInputFieldComponent, number]>> {
    const component = createComponent(NumberInputFieldComponent, {
        environmentInjector: environmentInjector
    });
    component.instance.label = 'Token Option ID';
    component.instance.isReadOnly = true;
    return new FormFieldComponentBuilder().setComp(component).modify({
        setIsReadOnly: (field) => {
            field.isReadOnly = true;
        }
    });
}

export function createExcludeTokenOptionsComponentBuilder(
    environmentInjector: EnvironmentInjector
): FormFieldComponentBuilder<
    FormField<
        [string, TokenATMConfiguration],
        number[],
        FormFieldAppender<StringInputFieldComponent, StaticFormField<TokenATMConfiguration>>
    >
> {
    return createFieldComponentWithLabel(
        StringInputFieldComponent,
        'Mutually Exclusive Token Options’ IDs (separated by commas)',
        environmentInjector
    )
        .appendField(new StaticFormField<TokenATMConfiguration>())
        .editField((field) => {
            field.validator = async (value: typeof field) => {
                field.fieldA.errorMessage = undefined;
                const [destValue, configuration] = await value.destValue;
                for (let idStr of destValue.split(',')) {
                    idStr = idStr.trim();
                    if (idStr.length == 0) continue;
                    if (isNaN(parseInt(idStr))) {
                        field.fieldA.errorMessage = 'Non-numeric value exists in the list!';
                        return false;
                    }
                    if (configuration.getTokenOptionById(parseInt(idStr)) == undefined) {
                        field.fieldA.errorMessage = `Token Option with id ${idStr} does not exist`;
                        return false;
                    }
                }
                return true;
            };
        })
        .transformDest(async ([value]) =>
            value
                .split(',')
                .filter((value) => value.trim(), length != 0)
                .map((value) => parseInt(value.trim()))
        );
}

export function createWithdrawTokenOptionComponentBuilder(
    tokenOptionChecker: (value: TokenOption) => Promise<string | undefined>,
    environmentInjector: EnvironmentInjector
): FormFieldComponentBuilder<
    FormField<
        [number, TokenATMConfiguration],
        number,
        FormFieldAppender<NumberInputFieldComponent, StaticFormField<TokenATMConfiguration>>
    >
> {
    return createFieldComponentWithLabel(NumberInputFieldComponent, 'Withdraw Token Option ID', environmentInjector)
        .appendField(new StaticFormField<TokenATMConfiguration>())
        .editField((field) => {
            field.validator = async (value: typeof field) => {
                value.fieldA.errorMessage = undefined;
                const [id, configuration] = await value.destValue;
                const tokenOption = configuration.getTokenOptionById(id);
                if (!tokenOption) {
                    value.fieldA.errorMessage = 'There is no token option with this id';
                    return false;
                }
                const result = await tokenOptionChecker(tokenOption);
                if (result != undefined) {
                    value.fieldA.errorMessage = result;
                    return false;
                }
                return true;
            };
        })
        .transformDest(async ([id]) => id);
}

const QuizDataDef = t.type({
    id: t.string,
    name: t.string
});

type QuizData = t.TypeOf<typeof QuizDataDef>;

export function createQuizFieldComponentBuilder(
    canvasService: CanvasService,
    environmentInjector: EnvironmentInjector
): FormFieldComponentBuilder<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FormField<[string, QuizData | undefined], QuizData, any>
> {
    return new FormFieldComponentBuilder()
        .setField(new StaticFormField<string>())
        .appendBuilder(
            createFieldComponentWithLabel(
                SingleSelectionFieldComponent<string>,
                'Canvas Quiz',
                environmentInjector
            ).editField((field) => {
                field.copyPasteHandler = {
                    serialize: async (v: string | undefined) => (v == undefined ? 'undefined' : JSON.stringify(v)),
                    deserialize: async (v: string) =>
                        v == 'undefined' ? undefined : unwrapValidation(t.string.decode(JSON.parse(v)))
                };
                field.validator = async ([v, field]: [string | undefined, SingleSelectionFieldComponent<string>]) => {
                    field.errorMessage = undefined;
                    if (v == undefined) {
                        field.errorMessage = 'Please select a Canvas quiz';
                        return false;
                    }
                    return true;
                };
            })
        )
        .appendVP(
            async (field) =>
                [await field.destValue, field.fieldB] as [
                    [string, string | undefined],
                    SingleSelectionFieldComponent<string>
                ]
        )
        .editField((field) => {
            field.validator = async ([[courseId, name], selectionField]: [
                [string, string | undefined],
                SingleSelectionFieldComponent<string>
            ]) => {
                if (name === undefined) return false;
                try {
                    await canvasService.getQuizIdByName(courseId, name);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (err: any) {
                    selectionField.errorMessage = err.toString();
                    return false;
                }
                return true;
            };
        })
        .transformSrc(([courseId, quizData]: [string, QuizData | undefined]) => [
            courseId,
            [
                quizData?.name,
                async () =>
                    (
                        await DataConversionHelper.convertAsyncIterableToList(await canvasService.getQuizzes(courseId))
                    ).map((v) => v.title)
            ]
        ])
        .transformDest(async ([courseId, name]) => {
            if (name == undefined) throw new Error('Invalid data');
            const id = await canvasService.getQuizIdByName(courseId, name);
            return {
                id,
                name
            };
        });
}

export function createStartTimeComponentBuilder(
    environmentInjector: EnvironmentInjector
): FormFieldComponentBuilder<DateTimeFieldComponent> {
    return createFieldComponentWithLabel(DateTimeFieldComponent, 'Students Can Request From', environmentInjector);
}

export function createEndTimeComponentBuilder(
    environmentInjector: EnvironmentInjector
): FormFieldComponentBuilder<DateTimeFieldComponent> {
    return createFieldComponentWithLabel(DateTimeFieldComponent, 'Students Can Request Until', environmentInjector);
}

export function createNewDueTimeComponentBuilder(
    environmentInjector: EnvironmentInjector,
    label: string
): FormFieldComponentBuilder<DateTimeFieldComponent> {
    return createFieldComponentWithLabel(DateTimeFieldComponent, label, environmentInjector).editField((field) => {
        field.validator = async ([field, value, isTimeValid]: [DateTimeFieldComponent, Date, boolean]) => {
            if (!DateTimeFieldComponent.DEFAULT_VALIDATOR([field, value, isTimeValid])) return false;
            const startRange = set(new Date(value), {
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    milliseconds: 0
                }),
                endRange = set(new Date(value), {
                    hours: 0,
                    minutes: 0,
                    seconds: 59,
                    milliseconds: 999
                });
            if (compareDesc(startRange, value) != -1 && compareDesc(endRange, value) != 1) {
                field.errorMessage = 'Canvas does not support a due date or until date between 00:00:00 and 00:00:59';
                return false;
            }
            return true;
        };
    });
}

export function createMultipleSectionDateComponentBuilder(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dateFieldBuilderFactory: () => FormFieldComponentBuilder<FormField<Date, Date, any>>,
    label: string,
    environmentInjector: EnvironmentInjector,
    defaultDateProvider?: () => Date
): FormFieldComponentBuilder<MultipleSectionDateFieldComponent> {
    return createFieldComponentWithLabel(MultipleSectionDateFieldComponent, label, environmentInjector).editField(
        (field) => {
            field.dateFieldBuilderFactory = dateFieldBuilderFactory;
            if (defaultDateProvider) field.defaultDateValueProvider = defaultDateProvider;
        }
    );
}

export function createGradeThresholdComponentBuilder(
    environmentInjector: EnvironmentInjector,
    label = 'Passing Grade Threshold',
    shortLabel = 'Grade threshold'
): FormFieldComponentBuilder<NumberInputFieldComponent> {
    return new FormFieldComponentBuilder()
        .setComp(createComponent(NumberInputFieldComponent, { environmentInjector: environmentInjector }))
        .editField((field) => {
            field.label = label;
            field.validator = async ([field, value]: [NumberInputFieldComponent, number]) => {
                field.errorMessage = undefined;
                if (typeof value != 'number') {
                    field.errorMessage = 'Invalid number';
                    return false;
                }
                if (value < 0 || value > 1) {
                    field.errorMessage = `${shortLabel} needs to be a number between 0 and 1 (inclusive). E.g, 0.7`;
                    return false;
                }
                return true;
            };
        });
}

const AssignmentDataDef = t.type({
    id: t.string,
    name: t.string
});

type AssignmentData = t.TypeOf<typeof AssignmentDataDef>;

export function createAssignmentFieldComponentBuilder(
    canvasService: CanvasService,
    environmentInjector: EnvironmentInjector,
    label = 'Canvas Assignment'
): FormFieldComponentBuilder<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FormField<[string, AssignmentData | undefined], AssignmentData, any>
> {
    return new FormFieldComponentBuilder()
        .setField(new StaticFormField<string>())
        .appendBuilder(
            createFieldComponentWithLabel(SingleSelectionFieldComponent<string>, label, environmentInjector).editField(
                (field) => {
                    field.copyPasteHandler = {
                        serialize: async (v: string | undefined) => (v == undefined ? 'undefined' : JSON.stringify(v)),
                        deserialize: async (v: string) =>
                            v == 'undefined' ? undefined : unwrapValidation(t.string.decode(JSON.parse(v)))
                    };
                    field.validator = async ([v, field]: [
                        string | undefined,
                        SingleSelectionFieldComponent<string>
                    ]) => {
                        field.errorMessage = undefined;
                        if (v == undefined) {
                            field.errorMessage = 'Please select a Canvas assignment';
                            return false;
                        }
                        return true;
                    };
                }
            )
        )
        .appendVP(
            async (field) =>
                [await field.destValue, field.fieldB] as [
                    [string, string | undefined],
                    SingleSelectionFieldComponent<string>
                ]
        )
        .editField((field) => {
            field.validator = async ([[courseId, name], selectionField]: [
                [string, string | undefined],
                SingleSelectionFieldComponent<string>
            ]) => {
                if (name === undefined) return false;
                try {
                    await canvasService.getAssignmentIdByName(courseId, name);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (err: any) {
                    selectionField.errorMessage = err.toString();
                    return false;
                }
                return true;
            };
        })
        .transformSrc(([courseId, assignmentData]: [string, AssignmentData | undefined]) => [
            courseId,
            [
                assignmentData?.name,
                async () =>
                    (
                        await DataConversionHelper.convertAsyncIterableToList(
                            await canvasService.getAssignments(courseId)
                        )
                    ).map((v) => v.name)
            ]
        ])
        .transformDest(async ([courseId, name]) => {
            if (name == undefined) throw new Error('Invalid data');
            const id = await canvasService.getAssignmentIdByName(courseId, name);
            return {
                id,
                name
            };
        });
}

export function tokenOptionFieldComponentBuilder(
    environmentInjector: EnvironmentInjector
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): FormFieldComponentBuilder<FormField<TokenOption | TokenOptionGroup, TokenOptionData, any>> {
    const builder = createIdFieldComponentBuilder(environmentInjector);
    const descriptionFieldComp = createComponent(StringTextareaFieldComponent, {
            environmentInjector: environmentInjector
        }),
        tokenBalanceChangeFieldComp = createComponent(NumberInputFieldComponent, {
            environmentInjector: environmentInjector
        });
    const nameFieldCompBuilder = createFieldComponentWithLabel(
        StringInputFieldComponent,
        'Token Option Name',
        environmentInjector
    )
        .appendField(new StaticFormField<[TokenOptionGroup, TokenOption | undefined]>())
        .editField((field) => {
            field.validator = async (value: typeof field) => {
                value.fieldA.errorMessage = undefined;
                const result = await value.destValue;
                if (result[0].length == 0) {
                    value.fieldA.errorMessage = 'Token Option Name cannot be empty';
                    return false;
                }
                const [group, cur] = result[1];
                for (const tokenOption of group.tokenOptions) {
                    if (cur == tokenOption) continue;
                    if (tokenOption.name == result[0]) {
                        value.fieldA.errorMessage =
                            'Cannot have two token options with the same name in a token option group';
                        return false;
                    }
                }
                return true;
            };
        })
        .transformDest(async ([description]) => description);
    descriptionFieldComp.instance.label = 'Information / Directions';
    tokenBalanceChangeFieldComp.instance.label = 'Token Balance Change';
    return builder
        .appendBuilder(nameFieldCompBuilder)
        .appendComp(descriptionFieldComp)
        .appendComp(tokenBalanceChangeFieldComp)
        .transformSrc((value: TokenOption | TokenOptionGroup) => {
            if (value instanceof TokenOptionGroup) {
                return [value.configuration.nextFreeTokenOptionId, ['', [value, undefined]], '', 0];
            } else {
                return [value.id, [value.name, [value.group, value]], value.description, value.tokenBalanceChange];
            }
        })
        .transformDest(async ([id, name, description, tokenBalanceChange]) => {
            return {
                type: 'invalid',
                id,
                name,
                description,
                tokenBalanceChange,
                isMigrating: false
            };
        });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tokenOptionValidationWrapper<F extends FormField<any, any, any>>(
    environmentInjector: EnvironmentInjector,
    builder: FormFieldComponentBuilder<F>,
    validator: (value: ExtractDest<F>) => boolean,
    errorMsg = 'Invalid token option data: check error message under each field for details'
) {
    return builder
        .appendComp(createComponent(ErrorMessageFieldComponent, { environmentInjector: environmentInjector }))
        .appendVP(async (field) => {
            try {
                const destValue = (await field.destValue)[0];
                return [field.fieldB, destValue, undefined] as [ErrorMessageFieldComponent, ExtractDest<F>, undefined];
            } catch (err: unknown) {
                return [field.fieldB, undefined, err] as [ErrorMessageFieldComponent, undefined, unknown];
            }
        })
        .editField((field) => {
            field.validator = async ([errorMsgField, value, err]: [
                ErrorMessageFieldComponent,
                ExtractDest<F> | undefined,
                unknown | undefined
            ]) => {
                errorMsgField.srcValue = undefined;
                if (err != undefined) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    errorMsgField.srcValue = `Failed to construct token option data: ${(err as any).toString()}`;
                    return false;
                }
                const result = validator(value as ExtractDest<F>);
                if (!result) errorMsgField.srcValue = errorMsg;
                return result;
            };
        })
        .transformSrc((key: ExtractSrc<F>) => {
            if (Array.isArray(key)) {
                return [...key, undefined] as TupleAppend<ExtractSrc<F>, undefined>;
            } else {
                return [key, undefined] as TupleAppend<ExtractSrc<F>, undefined>;
            }
        })
        .transformDest(async (value) => {
            if (value.length == 2) return value[0] as ExtractDest<F>;
            return value.slice(0, value.length - 1) as ExtractDest<F>;
        });
}
