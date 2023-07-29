import {
    TokenOptionFieldComponentFactory,
    createWithdrawTokenOptionComponentBuilder,
    tokenOptionFieldComponentBuilder
} from './token-option-field-component-factory';
import { Injectable, type EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
import type { TokenOption } from 'app/token-options/token-option';
import { WithdrawLabDataTokenOption } from 'app/token-options/withdraw-lab-data-token-option';

@Injectable()
export class WithdrawLabDataTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<WithdrawLabDataTokenOption> {
    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            WithdrawLabDataTokenOption | TokenOptionGroup,
            WithdrawLabDataTokenOption,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >
    ] {
        return tokenOptionFieldComponentBuilder(environmentInjector)
            .appendBuilder(
                createWithdrawTokenOptionComponentBuilder(
                    async (value: TokenOption) =>
                        value instanceof WithdrawLabDataTokenOption
                            ? undefined
                            : "Token option type invalid: should be 'Spend Tokens for Lab Data'",
                    environmentInjector
                )
            )
            .appendField(new StaticFormField<WithdrawLabDataTokenOption | TokenOptionGroup>())
            .transformSrc((value: WithdrawLabDataTokenOption | TokenOptionGroup) => {
                if (value instanceof TokenOptionGroup) {
                    return [value, [-1, value.configuration], value];
                } else {
                    return [value, [value.withdrawTokenOptionId, value.group.configuration], value];
                }
            })
            .transformDest(async ([id, name, description, tokenBalanceChange, withdrawTokenOptionId, value]) => {
                if (value instanceof TokenOptionGroup) {
                    return new WithdrawLabDataTokenOption(
                        value,
                        'withdraw-lab-data',
                        id,
                        name,
                        description,
                        tokenBalanceChange,
                        false,
                        withdrawTokenOptionId
                    );
                } else {
                    value.name = name;
                    value.description = description;
                    value.tokenBalanceChange = tokenBalanceChange;
                    value.withdrawTokenOptionId = withdrawTokenOptionId;
                    return value;
                }
            })
            .build();
    }
    public override get type(): string {
        return 'withdraw-lab-data';
    }
}
