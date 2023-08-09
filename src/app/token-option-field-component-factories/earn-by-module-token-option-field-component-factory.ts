import {
    TokenOptionFieldComponentFactory,
    createFieldComponentWithLabel,
    createGradeThresholdComponentBuilder,
    createStartTimeComponentBuilder,
    tokenOptionFieldComponentBuilder
} from './token-option-field-component-factory';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { Injectable, type EnvironmentInjector, type ViewContainerRef, Inject } from '@angular/core';
import type { FormField } from 'app/utils/form-field/form-field';
import { EarnByModuleTokenOption } from 'app/token-options/earn-by-module-token-option';
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
        FormField<EarnByModuleTokenOption | TokenOptionGroup, EarnByModuleTokenOption, any>
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
        return tokenOptionFieldComponentBuilder(environmentInjector)
            .appendBuilder(moduleComp)
            .appendBuilder(createStartTimeComponentBuilder(environmentInjector))
            .appendBuilder(createGradeThresholdComponentBuilder(environmentInjector))
            .appendField(new StaticFormField<EarnByModuleTokenOption | TokenOptionGroup>())
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
                        1,
                        value
                    ];
                } else {
                    return [
                        value,
                        [value.moduleName, value.group.configuration.course.id],
                        value.startTime,
                        value.gradeThreshold,
                        value
                    ];
                }
            })
            .transformDest(
                async ([
                    id,
                    name,
                    description,
                    tokenBalanceChange,
                    [moduleName, courseId],
                    startTime,
                    gradeThreshold,
                    value
                ]) => {
                    if (value instanceof TokenOptionGroup) {
                        return new EarnByModuleTokenOption(
                            value,
                            'earn-by-module',
                            id,
                            name,
                            description,
                            tokenBalanceChange,
                            false,
                            moduleName,
                            await this.canvasService.getModuleIdByName(courseId, moduleName),
                            startTime,
                            gradeThreshold
                        );
                    } else {
                        value.name = name;
                        value.description = description;
                        value.tokenBalanceChange = tokenBalanceChange;
                        value.moduleName = moduleName;
                        value.moduleId = await this.canvasService.getModuleIdByName(courseId, moduleName);
                        value.startTime = startTime;
                        value.gradeThreshold = gradeThreshold;
                        return value;
                    }
                }
            )
            .build();
    }

    public get type(): string {
        return 'earn-by-module';
    }
}
