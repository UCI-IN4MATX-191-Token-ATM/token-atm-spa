import { createComponent, Type, type EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import { DateTimeFieldComponent } from 'app/components/form-fields/date-time-field/date-time-field.component';
import { MultipleSectionDateFieldComponent } from 'app/components/form-fields/multiple-section-date-field/multiple-section-date-field.component';
import { NumberInputFieldComponent } from 'app/components/form-fields/number-input-field/number-input-field.component';
import { StringInputFieldComponent } from 'app/components/form-fields/string-input-field/string-input-field.component';
import { StringTextareaFieldComponent } from 'app/components/form-fields/string-textarea-field/string-textarea-field.component';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { CanvasService } from 'app/services/canvas.service';
import type { TokenOption } from 'app/token-options/token-option';
import type { FormField } from 'app/utils/form-field/form-field';
import type { FormFieldAppender } from 'app/utils/form-field/form-field-appender';
import { FormFieldComponentBuilder } from 'app/utils/form-field/form-field-component-builder';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
import { compareDesc, set } from 'date-fns';

export abstract class TokenOptionFieldComponentFactory<T extends TokenOption> {
    public abstract create(
        environmentInjector: EnvironmentInjector
    ): // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [(viewContainerRef: ViewContainerRef) => void, FormField<T | TokenOptionGroup, T, any>];
    public abstract get type(): string;
}

export type TOKEN_OPTION_FIELDS = [number, string, string, number];

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
    component.instance.label = 'ID';
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
        "Mutually Exclusive Token Options' IDs (separated by comma)",
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

export function createQuizFieldComponentBuilder(
    canvasService: CanvasService,
    environmentInjector: EnvironmentInjector
): FormFieldComponentBuilder<
    FormField<[string, string], [string, string], FormFieldAppender<StringInputFieldComponent, StaticFormField<string>>>
> {
    return createFieldComponentWithLabel(StringInputFieldComponent, 'Quiz Name', environmentInjector)
        .appendField(new StaticFormField<string>())
        .editField((field) => {
            field.validator = async (value: typeof field) => {
                value.fieldA.errorMessage = undefined;
                const [quizName, courseId] = await value.destValue;
                try {
                    await canvasService.getQuizIdByName(courseId, quizName);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (err: any) {
                    value.fieldA.errorMessage = err.toString();
                    return false;
                }
                return true;
            };
        });
}

export function createStartTimeComponentBuilder(
    environmentInjector: EnvironmentInjector
): FormFieldComponentBuilder<DateTimeFieldComponent> {
    return createFieldComponentWithLabel(DateTimeFieldComponent, 'Start Time', environmentInjector);
}

export function createEndTimeComponentBuilder(
    environmentInjector: EnvironmentInjector
): FormFieldComponentBuilder<DateTimeFieldComponent> {
    return createFieldComponentWithLabel(DateTimeFieldComponent, 'End Time', environmentInjector);
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
                field.errorMessage = 'Canvas does not support a due date or lock date between 00:00:00 and 00:00:59';
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
    environmentInjector: EnvironmentInjector
): FormFieldComponentBuilder<MultipleSectionDateFieldComponent> {
    return createFieldComponentWithLabel(MultipleSectionDateFieldComponent, label, environmentInjector).editField(
        (field) => {
            field.dateFieldBuilderFactory = dateFieldBuilderFactory;
        }
    );
}

export function createGradeThresholdComponentBuilder(
    environmentInjector: EnvironmentInjector
): FormFieldComponentBuilder<NumberInputFieldComponent> {
    return new FormFieldComponentBuilder()
        .setComp(createComponent(NumberInputFieldComponent, { environmentInjector: environmentInjector }))
        .editField((field) => {
            field.label = 'Grade Threshold';
            field.validator = async ([field, value]: [NumberInputFieldComponent, number]) => {
                field.errorMessage = undefined;
                if (typeof value != 'number') {
                    field.errorMessage = 'Invalid number';
                    return false;
                }
                if (value < 0 || value > 1) {
                    field.errorMessage = 'Grade threshold needs to be a number between 0 and 1 (inclusive). E.g, 0.7';
                    return false;
                }
                return true;
            };
        });
}

export function tokenOptionFieldComponentBuilder(
    environmentInjector: EnvironmentInjector
): FormFieldComponentBuilder<FormField<TokenOption | TokenOptionGroup, TOKEN_OPTION_FIELDS, TOKEN_OPTION_FIELDS>> {
    const builder = createIdFieldComponentBuilder(environmentInjector);
    const nameFieldComp = createComponent(StringInputFieldComponent, {
            environmentInjector: environmentInjector
        }),
        descriptionFieldComp = createComponent(StringTextareaFieldComponent, {
            environmentInjector: environmentInjector
        }),
        tokenBalanceChangeFieldComp = createComponent(NumberInputFieldComponent, {
            environmentInjector: environmentInjector
        });
    nameFieldComp.instance.label = 'Name';
    nameFieldComp.instance.validator = async ([field, value]: [StringInputFieldComponent, string]) => {
        field.errorMessage = value.length == 0 ? 'Token option name cannot be empty' : undefined;
        return value.length != 0;
    };
    descriptionFieldComp.instance.label = 'Description';
    tokenBalanceChangeFieldComp.instance.label = 'Token Balance Change';
    return builder
        .appendComp(nameFieldComp)
        .appendComp(descriptionFieldComp)
        .appendComp(tokenBalanceChangeFieldComp)
        .transformSrc((value: TokenOption | TokenOptionGroup) => {
            if (value instanceof TokenOptionGroup) {
                return [value.configuration.nextFreeTokenOptionId, '', '', 0];
            } else {
                return [value.id, value.name, value.description, 0];
            }
        })
        .transformVP((field) => field.destValue);
}
