import {
    TokenOptionFieldComponentFactory,
    createExcludeTokenOptionsComponentBuilder,
    tokenOptionFieldComponentBuilder
} from './token-option-field-component-factory';
import { Injectable, type EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
import { SpendForLabSwitchTokenOption } from 'app/token-options/spend-for-lab-switch-token-option';

@Injectable()
export class SpendForLabSwitchTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<SpendForLabSwitchTokenOption> {
    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            SpendForLabSwitchTokenOption | TokenOptionGroup,
            SpendForLabSwitchTokenOption,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >
    ] {
        return tokenOptionFieldComponentBuilder(environmentInjector)
            .appendBuilder(createExcludeTokenOptionsComponentBuilder(environmentInjector))
            .appendField(new StaticFormField<SpendForLabSwitchTokenOption | TokenOptionGroup>())
            .transformSrc((value: SpendForLabSwitchTokenOption | TokenOptionGroup) => {
                if (value instanceof TokenOptionGroup) {
                    return [value, ['', value.configuration], value];
                } else {
                    return [value, [value.excludeTokenOptionIds.join(','), value.group.configuration], value];
                }
            })
            .transformDest(async ([id, name, description, tokenBalanceChange, excludeTokenOptionIds, value]) => {
                if (value instanceof TokenOptionGroup) {
                    return new SpendForLabSwitchTokenOption(
                        value,
                        'spend-for-lab-switch',
                        id,
                        name,
                        description,
                        tokenBalanceChange,
                        false,
                        excludeTokenOptionIds
                    );
                } else {
                    value.name = name;
                    value.description = description;
                    value.tokenBalanceChange = tokenBalanceChange;
                    value.excludeTokenOptionIds = excludeTokenOptionIds;
                    return value;
                }
            })
            .build();
    }
    public override get type(): string {
        return 'spend-for-lab-switch';
    }
}
