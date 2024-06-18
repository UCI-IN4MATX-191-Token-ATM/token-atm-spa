import type * as t from 'io-ts';
import { ATokenOption, TokenOptionDataDef } from '../token-option';
import { ToJSONMixin } from '../mixins/to-json-mixin';
import { FromDataMixin } from '../mixins/from-data-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';

// export class BasicTokenOption extends TokenOption {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     public static deserialize(group: TokenOptionGroup, data: any): BasicTokenOption {
//         return new BasicTokenOption(...super.resolveTokenOption(group, data));
//     }
// }

export const BasicTokenOptionDataDef = TokenOptionDataDef;

export type BasicTokenOptionData = t.TypeOf<typeof BasicTokenOptionDataDef>;
export type RawBasicTokenOptionData = t.OutputOf<typeof BasicTokenOptionDataDef>;

export class BasicTokenOption extends FromDataMixin(
    ToJSONMixin(ATokenOption, BasicTokenOptionDataDef.encode),
    unwrapValidationFunc(BasicTokenOptionDataDef.decode),
    BasicTokenOptionDataDef.is
) {}
