import {
    TokenOptionFieldComponentFactory,
    createWithdrawTokenOptionComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from '../../token-option-field-component-factories/token-option-field-component-factory';
import { Injectable, type EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import type { TokenOption } from 'app/token-options/token-option';
import {
    WithdrawLabDataTokenOption,
    WithdrawLabDataTokenOptionData,
    WithdrawLabDataTokenOptionDataDef
} from 'app/token-options/withdraw-lab-data/withdraw-lab-data-token-option';
import { SpendForLabDataTokenOption } from 'app/token-options/spend-for-lab-data/spend-for-lab-data-token-option';

@Injectable()
export class WithdrawLabDataTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<WithdrawLabDataTokenOption> {
    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            WithdrawLabDataTokenOption | TokenOptionGroup,
            WithdrawLabDataTokenOptionData,
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
                            value instanceof SpendForLabDataTokenOption
                                ? undefined
                                : "Token option type invalid: should be 'Spend Tokens for Lab Data'",
                        environmentInjector
                    )
                )
                .transformSrc((value: WithdrawLabDataTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        return [value, [-1, value.configuration]];
                    } else {
                        return [value, [value.withdrawTokenOptionId, value.group.configuration]];
                    }
                })
                .transformDest(async ([tokenOptionData, withdrawTokenOptionId]) => {
                    return {
                        ...tokenOptionData,
                        type: 'withdraw-lab-data',
                        withdrawTokenOptionId
                    };
                }),
            WithdrawLabDataTokenOptionDataDef.is
        ).build();
    }
    public override get type(): string {
        return 'withdraw-lab-data';
    }
}
