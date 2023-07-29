import {
    TokenOptionFieldComponentFactory,
    createWithdrawTokenOptionComponentBuilder,
    tokenOptionFieldComponentBuilder
} from './token-option-field-component-factory';
import { Injectable, type EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import { StaticFormField } from 'app/utils/form-field/static-form-field';
import { WithdrawAssignmentResubmissionTokenOption } from 'app/token-options/withdraw-assignment-resubmission-token-option';
import { SpendForAssignmentResubmissionTokenOption } from 'app/token-options/spend-for-assignment-resubmission-token-option';
import type { TokenOption } from 'app/token-options/token-option';

@Injectable()
export class WithdrawAssignmentResubmissionTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<WithdrawAssignmentResubmissionTokenOption> {
    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            WithdrawAssignmentResubmissionTokenOption | TokenOptionGroup,
            WithdrawAssignmentResubmissionTokenOption,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any
        >
    ] {
        return tokenOptionFieldComponentBuilder(environmentInjector)
            .appendBuilder(
                createWithdrawTokenOptionComponentBuilder(
                    async (value: TokenOption) =>
                        value instanceof SpendForAssignmentResubmissionTokenOption
                            ? undefined
                            : "Token option type invalid: should be 'Spend Tokens for Assignment Resubmission'",
                    environmentInjector
                )
            )
            .appendField(new StaticFormField<WithdrawAssignmentResubmissionTokenOption | TokenOptionGroup>())
            .transformSrc((value: WithdrawAssignmentResubmissionTokenOption | TokenOptionGroup) => {
                if (value instanceof TokenOptionGroup) {
                    return [value, [-1, value.configuration], value];
                } else {
                    return [value, [value.withdrawTokenOptionId, value.group.configuration], value];
                }
            })
            .transformDest(async ([id, name, description, tokenBalanceChange, withdrawTokenOptionId, value]) => {
                if (value instanceof TokenOptionGroup) {
                    return new WithdrawAssignmentResubmissionTokenOption(
                        value,
                        'withdraw-assignment-resubmission',
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
        return 'withdraw-assignment-resubmission';
    }
}
