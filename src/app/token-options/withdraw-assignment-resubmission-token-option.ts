import * as t from 'io-ts';
import { SpendForAssignmentResubmissionTokenOption } from './spend-for-assignment-resubmission-token-option';
import { TokenOptionDataDef, ATokenOption } from './token-option';
import { WithdrawTokenOptionMixin, WithdrawTokenOptionMixinDataDef } from './mixins/withdraw-token-option-mixin';
import { WithdrawTokenOptionMultipleSectionEndTimeMixin } from './mixins/withdraw-token-option-multiple-section-end-time-mixin';
import { WithdrawTokenOptionStartTimeMixin } from './mixins/withdraw-token-option-start-time-mixin';
import { ToJSONMixin } from './mixins/to-json-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import { FromDataMixin } from './mixins/from-data-mixin';

// export class WithdrawAssignmentResubmissionTokenOption extends WithdrawTokenOption<SpendForAssignmentResubmissionTokenOption> {
//     protected validateTokenOptionType(tokenOption: TokenOption): boolean {
//         return tokenOption instanceof SpendForAssignmentResubmissionTokenOption;
//     }

//     public get startTime(): Date | undefined {
//         return this.withdrawTokenOption?.startTime;
//     }

//     public get endTime(): Date | MultipleSectionDateMatcher | undefined {
//         return this.withdrawTokenOption?.endTime;
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     public static deserialize(group: TokenOptionGroup, data: any): WithdrawAssignmentResubmissionTokenOption {
//         return new WithdrawAssignmentResubmissionTokenOption(...super.resolveWithdrawTokenOption(group, data));
//     }
// }

export const WithdrawAssignmentResubmissionTokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    WithdrawTokenOptionMixinDataDef
]);

export type WithdrawAssignmentResubmissionTokenOptionData = t.TypeOf<
    typeof WithdrawAssignmentResubmissionTokenOptionDataDef
>;
export type RawWithdrawAssignmentResubmissionTokenOptionData = t.OutputOf<
    typeof WithdrawAssignmentResubmissionTokenOptionDataDef
>;

export class WithdrawAssignmentResubmissionTokenOption extends FromDataMixin(
    ToJSONMixin(
        WithdrawTokenOptionMultipleSectionEndTimeMixin(
            WithdrawTokenOptionStartTimeMixin(
                WithdrawTokenOptionMixin(
                    ATokenOption,
                    (v: unknown): v is SpendForAssignmentResubmissionTokenOption =>
                        v instanceof SpendForAssignmentResubmissionTokenOption
                )
            )
        ),
        WithdrawAssignmentResubmissionTokenOptionDataDef.encode
    ),
    unwrapValidationFunc(WithdrawAssignmentResubmissionTokenOptionDataDef.decode),
    WithdrawAssignmentResubmissionTokenOptionDataDef.is
) {}
