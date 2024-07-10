import * as t from 'io-ts';
import { AssignmentMixin, AssignmentMixinDataDef } from '../mixins/assignment-mixin';
import { ATokenOption, TokenOptionDataDef } from '../token-option';
import { FromDataMixin } from '../mixins/from-data-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import { ToJSONMixin } from '../mixins/to-json-mixin';

export const SpendForAssignmentExtensionTokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    AssignmentMixinDataDef
]);

export type SpendForAssignmentExtensionTokenOptionData = t.TypeOf<typeof SpendForAssignmentExtensionTokenOptionDataDef>;

export class SpendForAssignmentExtensionTokenOption extends FromDataMixin(
    ToJSONMixin(AssignmentMixin(ATokenOption), SpendForAssignmentExtensionTokenOptionDataDef.encode),
    unwrapValidationFunc(SpendForAssignmentExtensionTokenOptionDataDef.decode),
    SpendForAssignmentExtensionTokenOptionDataDef.is
) {}
