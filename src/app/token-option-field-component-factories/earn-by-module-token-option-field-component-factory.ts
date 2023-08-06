import {
    TokenOptionFieldComponentFactory,
    createFieldComponentWithLabel,
    createGradeThresholdComponentBuilder,
    createStartTimeComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from './token-option-field-component-factory';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { Injectable, type EnvironmentInjector, type ViewContainerRef, Inject } from '@angular/core';
import type { FormField } from 'app/utils/form-field/form-field';
import {
    EarnByModuleTokenOptionDataDef,
    type EarnByModuleTokenOption,
    type EarnByModuleTokenOptionData
} from 'app/token-options/earn-by-module-token-option';
import { CanvasService } from 'app/services/canvas.service';
import { StringInputFieldComponent } from 'app/components/form-fields/string-input-field/string-input-field.component';
import { set } from 'date-fns';

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
        const moduleComp = createFieldComponentWithLabel(StringInputFieldComponent, 'Module Name', environmentInjector)
            .appendField(new StaticFormField<string>())
            .editField((field) => {
                field.validator = async (value: typeof field) => {
                    value.fieldA.errorMessage = undefined;
                    const [moduleName, courseId] = await value.destValue;
                    try {
                        await this.canvasService.getModuleIdByName(courseId, moduleName);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } catch (err: any) {
                        value.fieldA.errorMessage = err.toString();
                        return false;
                    }
                    return true;
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
                            ['', value.configuration.course.id],
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
                            [value.moduleName, value.group.configuration.course.id],
                            value.startTime,
                            value.gradeThreshold
                        ];
                    }
                })
                .transformDest(async ([tokenOptionData, [moduleName, courseId], startTime, gradeThreshold]) => {
                    return {
                        ...tokenOptionData,
                        type: 'earn-by-module',
                        moduleName,
                        moduleId: await this.canvasService.getModuleIdByName(courseId, moduleName),
                        startTime,
                        gradeThreshold
                    };
                }),
            EarnByModuleTokenOptionDataDef.is
        ).build();
    }

    public get type(): string {
        return 'earn-by-module';
    }
}
