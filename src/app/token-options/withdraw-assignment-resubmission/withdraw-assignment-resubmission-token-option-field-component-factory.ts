import {
    TokenOptionFieldComponentFactory,
    createWithdrawTokenOptionComponentBuilder,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from '../token-option-field-component-factory';
import { Injectable, type EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import { TokenOptionGroup } from 'app/data/token-option-group';
import type { FormField } from 'app/utils/form-field/form-field';
import {
    type WithdrawAssignmentResubmissionTokenOption,
    type WithdrawAssignmentResubmissionTokenOptionData,
    WithdrawAssignmentResubmissionTokenOptionDataDef
} from 'app/token-options/withdraw-assignment-resubmission/withdraw-assignment-resubmission-token-option';
import { SpendForAssignmentResubmissionTokenOption } from 'app/token-options/spend-for-assignment-resubmission/spend-for-assignment-resubmission-token-option';
import type { TokenOption } from 'app/token-options/token-option';

@Injectable()
export class WithdrawAssignmentResubmissionTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<WithdrawAssignmentResubmissionTokenOption> {
    public override create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        FormField<
            WithdrawAssignmentResubmissionTokenOption | TokenOptionGroup,
            WithdrawAssignmentResubmissionTokenOptionData,
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
                            value instanceof SpendForAssignmentResubmissionTokenOption
                                ? undefined
                                : "Token option type invalid: should be 'Spend Tokens for Assignment Resubmission on Canvas'", // TODO: state 'Canvas Assignment' or `on Canvas`
                        environmentInjector
                    )
                )
                .transformSrc((value: WithdrawAssignmentResubmissionTokenOption | TokenOptionGroup) => {
                    if (value instanceof TokenOptionGroup) {
                        return [value, [-1, value.configuration]];
                    } else {
                        return [value, [value.withdrawTokenOptionId, value.group.configuration]];
                    }
                })
                .transformDest(async ([tokenOptionData, withdrawTokenOptionId]) => {
                    return {
                        ...tokenOptionData,
                        type: 'withdraw-assignment-resubmission',
                        withdrawTokenOptionId
                    };
                }),
            WithdrawAssignmentResubmissionTokenOptionDataDef.is
        ).build();
    }
    public override get type(): string {
        return 'withdraw-assignment-resubmission';
    }
}
