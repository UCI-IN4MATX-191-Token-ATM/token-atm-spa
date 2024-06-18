import * as t from 'io-ts';
import { SpendForLabSwitchTokenOption } from '../spend-for-lab-switch/spend-for-lab-switch-token-option';
import { TokenOptionDataDef, ATokenOption } from '../token-option';
import { WithdrawTokenOptionMixin, WithdrawTokenOptionMixinDataDef } from '../mixins/withdraw-token-option-mixin';
import { ToJSONMixin } from '../mixins/to-json-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import { FromDataMixin } from '../mixins/from-data-mixin';

// export class WithdrawLabSwitchTokenOption extends WithdrawTokenOption<SpendForLabSwitchTokenOption> {
//     protected validateTokenOptionType(tokenOption: TokenOption): boolean {
//         return tokenOption instanceof SpendForLabSwitchTokenOption;
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     public static deserialize(group: TokenOptionGroup, data: any): WithdrawLabSwitchTokenOption {
//         return new WithdrawLabSwitchTokenOption(...super.resolveWithdrawTokenOption(group, data));
//     }
// }

export const WithdrawLabSwitchTokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    WithdrawTokenOptionMixinDataDef
]);

export type WithdrawLabSwitchTokenOptionData = t.TypeOf<typeof WithdrawLabSwitchTokenOptionDataDef>;
export type RawWithdrawLabSwitchTokenOptionData = t.OutputOf<typeof WithdrawLabSwitchTokenOptionDataDef>;

export class WithdrawLabSwitchTokenOption extends FromDataMixin(
    ToJSONMixin(
        WithdrawTokenOptionMixin(
            ATokenOption,
            (v: unknown): v is SpendForLabSwitchTokenOption => v instanceof SpendForLabSwitchTokenOption
        ),
        WithdrawLabSwitchTokenOptionDataDef.encode
    ),
    unwrapValidationFunc(WithdrawLabSwitchTokenOptionDataDef.decode),
    WithdrawLabSwitchTokenOptionDataDef.is
) {}
