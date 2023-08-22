import * as t from 'io-ts';
import { ATokenOption, TokenOptionDataDef } from './token-option';
import { ExcludeTokenOptionIdsMixin, ExcludeTokenOptionIdsMixinDataDef } from './mixins/exclude-token-option-ids-mixin';
import { ToJSONMixin } from './mixins/to-json-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import { FromDataMixin } from './mixins/from-data-mixin';

// export class SpendForLabSwitchTokenOption extends TokenOption {
//     private _excludeTokenOptionIds: number[];

//     constructor(
//         group: TokenOptionGroup,
//         type: string,
//         id: number,
//         name: string,
//         description: string,
//         tokenBalanceChange: number,
//         isMigrating: boolean,
//         excludeTokenOptionIds: number[]
//     ) {
//         super(group, type, id, name, description, tokenBalanceChange, isMigrating);
//         this._excludeTokenOptionIds = excludeTokenOptionIds;
//     }

//     public get excludeTokenOptionIds(): number[] {
//         return this._excludeTokenOptionIds;
//     }

//     public set excludeTokenOptionIds(excludeTokenOptionIds: number[]) {
//         this._excludeTokenOptionIds = excludeTokenOptionIds;
//     }

//     public override toJSON(): object {
//         return {
//             ...super.toJSON(),
//             exclude_token_option_ids: this._excludeTokenOptionIds
//         };
//     }

//     protected static resolveSpendForLabSwitchTokenOption(
//         group: TokenOptionGroup,
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         data: any
//     ): ConstructorParameters<typeof SpendForLabSwitchTokenOption> {
//         if (
//             (typeof data['exclude_token_option_ids'] != 'undefined' &&
//                 typeof data['exclude_token_option_ids'] != 'object') ||
//             (typeof data['exclude_token_option_ids'] == 'object' && !Array.isArray(data['exclude_token_option_ids']))
//         ) {
//             throw new Error('Invalid data');
//         }
//         if (data['exclude_token_option_ids'] != undefined)
//             for (const id of data['exclude_token_option_ids']) {
//                 if (typeof id != 'number') throw new Error('Invalid data');
//             }
//         return [...super.resolveTokenOption(group, data), data['exclude_token_option_ids'] ?? []];
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     public static deserialize(group: TokenOptionGroup, data: any): SpendForLabSwitchTokenOption {
//         return new SpendForLabSwitchTokenOption(...this.resolveSpendForLabSwitchTokenOption(group, data));
//     }
// }

export const SpendForLabSwitchTokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    ExcludeTokenOptionIdsMixinDataDef
]);

export type SpendForLabSwitchTokenOptionData = t.TypeOf<typeof SpendForLabSwitchTokenOptionDataDef>;
export type RawSpendForLabSwitchTokenOptionData = t.OutputOf<typeof SpendForLabSwitchTokenOptionDataDef>;

export class SpendForLabSwitchTokenOption extends FromDataMixin(
    ToJSONMixin(ExcludeTokenOptionIdsMixin(ATokenOption), SpendForLabSwitchTokenOptionDataDef.encode),
    unwrapValidationFunc(SpendForLabSwitchTokenOptionDataDef.decode),
    SpendForLabSwitchTokenOptionDataDef.is
) {}
