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
        const moduleComp = createFieldComponentWithLabel(
            SingleSelectionFieldComponent<ModuleData>,
            'Canvas Module',
            environmentInjector
        )
            .editField((field) => {
                field.optionRenderer = (v) => v.name;
                field.copyPasteHandler = {
                    serialize: async (v: ModuleData | undefined) =>
                        v == undefined ? 'undefined' : JSON.stringify(ModuleDataDef.encode(v)),
                    deserialize: async (v: string) =>
                        v == 'undefined' ? undefined : unwrapValidation(ModuleDataDef.decode(JSON.parse(v)))
                };
                field.validator = async ([v, field]: [
                    ModuleData | undefined,
                    SingleSelectionFieldComponent<ModuleData>
                ]) => {
                    field.errorMessage = undefined;
                    if (v == undefined) {
                        field.errorMessage = 'Please select a Canvas module';
                        return false;
                    }
                    return true;
                };
            })
            .transformSrc(([courseId, moduleData]: [string, ModuleData | undefined]) => [
                moduleData,
                async () =>
                    (
                        await DataConversionHelper.convertAsyncIterableToList(
                            await this.canvasService.getModules(courseId)
                        )
                    ).map((v) => ({
                        id: v.id,
                        name: v.name
                    }))
            ])
            .transformDest(async (value) => value as ModuleData);
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
