import * as t from 'io-ts';
import { SpendForLabDataTokenOption } from './spend-for-lab-data-token-option';
import { TokenOptionDataDef, ATokenOption } from './token-option';
import { WithdrawTokenOptionMixin, WithdrawTokenOptionMixinDataDef } from './mixins/withdraw-token-option-mixin';
import { WithdrawTokenOptionStartTimeMixin } from './mixins/withdraw-token-option-start-time-mixin';
import { WithdrawTokenOptionEndTimeMixin } from './mixins/withdraw-token-option-end-time-mixin';
import { ToJSONMixin } from './mixins/to-json-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import { FromDataMixin } from './mixins/from-data-mixin';

// export class WithdrawLabDataTokenOption extends WithdrawTokenOption<SpendForLabDataTokenOption> {
//     protected validateTokenOptionType(tokenOption: TokenOption): boolean {
//         return tokenOption instanceof SpendForLabDataTokenOption;
//     }

//     public get startTime(): Date | undefined {
//         return this.withdrawTokenOption?.startTime;
//     }

//     public get endTime(): Date | undefined {
//         return this.withdrawTokenOption?.endTime;
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     public static deserialize(group: TokenOptionGroup, data: any): WithdrawLabDataTokenOption {
//         return new WithdrawLabDataTokenOption(...super.resolveWithdrawTokenOption(group, data));
//     }
// }

export const WithdrawLabDataTokenOptionDataDef = t.intersection([TokenOptionDataDef, WithdrawTokenOptionMixinDataDef]);

export type WithdrawLabDataTokenOptionData = t.TypeOf<typeof WithdrawLabDataTokenOptionDataDef>;

export class WithdrawLabDataTokenOption extends FromDataMixin(
    ToJSONMixin(
        WithdrawTokenOptionEndTimeMixin(
            WithdrawTokenOptionStartTimeMixin(
                WithdrawTokenOptionMixin(
                    ATokenOption,
                    (v: unknown): v is SpendForLabDataTokenOption => v instanceof SpendForLabDataTokenOption
                )
            )
        ),
        WithdrawLabDataTokenOptionDataDef.encode
    ),
    unwrapValidationFunc(WithdrawLabDataTokenOptionDataDef.decode),
    WithdrawLabDataTokenOptionDataDef.is
) {}
