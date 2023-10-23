import {
    TokenOptionFieldComponentFactory,
    createAssignmentFieldComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from './token-option-field-component-factory';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { Injectable, type EnvironmentInjector, type ViewContainerRef, Inject } from '@angular/core';
import type { FormField } from 'app/utils/form-field/form-field';
import {
    SpendForAssignmentExtensionTokenOptionDataDef,
    type SpendForAssignmentExtensionTokenOption,
    type SpendForAssignmentExtensionTokenOptionData
} from 'app/token-options/spend-for-assignment-extension-token-option';
import { CanvasService } from 'app/services/canvas.service';

@Injectable()
export class SpendForAssignmentExtensionTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<SpendForAssignmentExtensionTokenOption> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            SpendForAssignmentExtensionTokenOption | TokenOptionGroup,
            SpendForAssignmentExtensionTokenOptionData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >
    ] {
        return tokenOptionValidationWrapper(
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .appendBuilder(createAssignmentFieldComponentBuilder(this.canvasService, environmentInjector))
                .transformSrc((value: SpendForAssignmentExtensionTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) return [value, ['', value.configuration.course.id]];
                    else return [value, [value.assignmentName, value.group.configuration.course.id]];
                })
                .transformDest(async ([tokenOptionData, [assignmentName, courseId]]) => {
                    return {
                        ...tokenOptionData,
                        type: 'spend-for-assignment-extension',
                        assignmentName,
                        assignmentId: await this.canvasService.getAssignmentIdByName(courseId, assignmentName)
                    };
                }),
            SpendForAssignmentExtensionTokenOptionDataDef.is
        ).build();
    }

    public get type(): string {
        return 'spend-for-assignment-extension';
    }
}
