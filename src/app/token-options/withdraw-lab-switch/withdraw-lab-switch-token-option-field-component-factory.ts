import {
    TokenOptionFieldComponentFactory,
    createWithdrawTokenOptionComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from '../token-option-field-component-factory';
import { Injectable, type EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
import type { TokenOption } from 'app/token-options/token-option';
import {
    WithdrawLabSwitchTokenOption,
    WithdrawLabSwitchTokenOptionData,
    WithdrawLabSwitchTokenOptionDataDef
} from 'app/token-options/withdraw-lab-switch/withdraw-lab-switch-token-option';
import { SpendForLabSwitchTokenOption } from 'app/token-options/spend-for-lab-switch/spend-for-lab-switch-token-option';

@Injectable()
export class WithdrawLabSwitchTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<WithdrawLabSwitchTokenOption> {
    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            WithdrawLabSwitchTokenOption | TokenOptionGroup,
            WithdrawLabSwitchTokenOptionData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >
    ] {
        return tokenOptionValidationWrapper(
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .appendBuilder(
                    createWithdrawTokenOptionComponentBuilder(
                        async (value: TokenOption) =>
                            value instanceof SpendForLabSwitchTokenOption
                                ? undefined
                                : "Token option type invalid: should be 'Spend Tokens for Switching Lab'",
                        environmentInjector
                    )
                )
                .appendField(new StaticFormField<WithdrawLabSwitchTokenOption | TokenOptionGroup>())
                .transformSrc((value: WithdrawLabSwitchTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        return [value, [-1, value.configuration], value];
                    } else {
                        return [value, [value.withdrawTokenOptionId, value.group.configuration], value];
                    }
                })
                .transformDest(async ([tokenOptionData, withdrawTokenOptionId]) => {
                    return {
                        ...tokenOptionData,
                        type: 'withdraw-lab-switch',
                        withdrawTokenOptionId
                    };
                }),
            WithdrawLabSwitchTokenOptionDataDef.is
        ).build();
    }
    public override get type(): string {
        return 'withdraw-lab-switch';
    }
}
