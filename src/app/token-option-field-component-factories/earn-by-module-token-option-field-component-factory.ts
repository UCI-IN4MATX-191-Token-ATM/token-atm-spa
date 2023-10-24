import {
    TokenOptionFieldComponentFactory,
    createFieldComponentWithLabel,
    createGradeThresholdComponentBuilder,
    createStartTimeComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from './token-option-field-component-factory';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { Injectable, type EnvironmentInjector, type ViewContainerRef, Inject } from '@angular/core';
import type { FormField } from 'app/utils/form-field/form-field';
import {
    EarnByModuleTokenOptionDataDef,
    type EarnByModuleTokenOption,
    type EarnByModuleTokenOptionData
} from 'app/token-options/earn-by-module-token-option';
import { CanvasService } from 'app/services/canvas.service';
import { set } from 'date-fns';
import { SingleSelectionFieldComponent } from 'app/components/form-fields/selection-fields/single-selection-field/single-selection-field.component';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';
import * as t from 'io-ts';
import { FormFieldComponentBuilder } from 'app/utils/form-field/form-field-component-builder';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
import { unwrapValidation } from 'app/utils/validation-unwrapper';

const ModuleDataDef = t.type({
    id: t.string,
    name: t.string
});

type ModuleData = t.TypeOf<typeof ModuleDataDef>;

@Injectable()
export class EarnByModuleTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<EarnByModuleTokenOption> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        FormField<EarnByModuleTokenOption | TokenOptionGroup, EarnByModuleTokenOptionData, any>
    ] {
        const moduleComp = new FormFieldComponentBuilder()
            .setField(new StaticFormField<string>())
            .appendBuilder(
                createFieldComponentWithLabel(
                    SingleSelectionFieldComponent<string>,
                    'Canvas Module Name',
                    environmentInjector
                ).editField((field) => {
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
                            field.errorMessage = 'Please select a Canvas module';
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
                        await this.canvasService.getModuleIdByName(courseId, name);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (err: any) {
                        selectionField.errorMessage = err.toString();
                        return false;
                    }
                    return true;
                };
            })
            .transformSrc(([courseId, moduleData]: [string, ModuleData | undefined]) => [
                courseId,
                [
                    moduleData?.name,
                    async () =>
                        (
                            await DataConversionHelper.convertAsyncIterableToList(
                                await this.canvasService.getModules(courseId)
                            )
                        ).map((v) => v.name)
                ]
            ])
            .transformDest(async ([courseId, name]) => {
                if (name == undefined) throw new Error('Invalid data');
                const id = await this.canvasService.getModuleIdByName(courseId, name);
                return {
                    id,
                    name
                };
            });
        return tokenOptionValidationWrapper(
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .appendBuilder(moduleComp)
                .appendBuilder(createStartTimeComponentBuilder(environmentInjector))
                .appendBuilder(createGradeThresholdComponentBuilder(environmentInjector))
                .transformSrc((value: EarnByModuleTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        return [
                            value,
                            [value.configuration.course.id, undefined],
                            set(new Date(), {
                                hours: 0,
                                minutes: 0,
                                seconds: 0,
                                milliseconds: 0
                            }),
                            1
                        ];
                    } else {
                        return [
                            value,
                            [
                                value.group.configuration.course.id,
                                <ModuleData>{
                                    id: value.moduleId,
                                    name: value.moduleName
                                }
                            ],
                            value.startTime,
                            value.gradeThreshold
                        ];
                    }
                })
                .transformDest(
                    async ([tokenOptionData, { id: moduleId, name: moduleName }, startTime, gradeThreshold]) => {
                        return {
                            ...tokenOptionData,
                            type: 'earn-by-module',
                            moduleId,
                            moduleName,
                            startTime,
                            gradeThreshold
                        };
                    }
                ),
            EarnByModuleTokenOptionDataDef.is
        ).build();
    }

    public get type(): string {
        return 'earn-by-module';
    }
}
