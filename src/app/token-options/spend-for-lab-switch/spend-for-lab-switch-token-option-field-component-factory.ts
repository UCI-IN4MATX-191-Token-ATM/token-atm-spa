import {
    TokenOptionFieldComponentFactory,
    createExcludeTokenOptionsComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from '../token-option-field-component-factory';
import { Injectable, type EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import {
    SpendForLabSwitchTokenOption,
    SpendForLabSwitchTokenOptionData,
    SpendForLabSwitchTokenOptionDataDef
} from 'app/token-options/spend-for-lab-switch/spend-for-lab-switch-token-option';

@Injectable()
export class SpendForLabSwitchTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<SpendForLabSwitchTokenOption> {
    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            SpendForLabSwitchTokenOption | TokenOptionGroup,
            SpendForLabSwitchTokenOptionData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >
    ] {
        return tokenOptionValidationWrapper(
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .appendBuilder(createExcludeTokenOptionsComponentBuilder(environmentInjector))
                .transformSrc((value: SpendForLabSwitchTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        return [value, ['', value.configuration]];
                    } else {
                        return [value, [value.excludeTokenOptionIds.join(','), value.group.configuration]];
                    }
                })
                .transformDest(async ([tokenOptionData, excludeTokenOptionIds]) => {
                    return {
                        ...tokenOptionData,
                        type: 'spend-for-lab-switch',
                        excludeTokenOptionIds
                    };
                }),
            SpendForLabSwitchTokenOptionDataDef.is
        ).build();
    }
    public override get type(): string {
        return 'spend-for-lab-switch';
    }
}
