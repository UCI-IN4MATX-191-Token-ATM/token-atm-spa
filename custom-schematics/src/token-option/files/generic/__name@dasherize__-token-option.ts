import * as t from 'io-ts';
import { ATokenOption, TokenOptionDataDef } from 'app/token-options/token-option';
import { ToJSONMixin } from 'app/token-options/mixins/to-json-mixin';
import { FromDataMixin } from 'app/token-options/mixins/from-data-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';

export const <%= classify(name) %>TokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    t.strict({}) // TODO-Now: replace with other DataDefs
]);

export type <%= classify(name) %>TokenOptionData = t.TypeOf<typeof <%= classify(name) %>TokenOptionDataDef>;
export type Raw<%= classify(name) %>TokenOptionData = t.OutputOf<typeof <%= classify(name) %>TokenOptionDataDef>;

// TODO-Now: wrap ATokenOption with mixins
class A<%= classify(name) %>TokenOption extends ATokenOption {}

export class <%= classify(name) %>TokenOption extends FromDataMixin(
    ToJSONMixin(A<%= classify(name) %>TokenOption, <%= classify(name) %>TokenOptionDataDef.encode),
    unwrapValidationFunc(<%= classify(name) %>TokenOptionDataDef.decode),
    <%= classify(name) %>TokenOptionDataDef.is
) {}
