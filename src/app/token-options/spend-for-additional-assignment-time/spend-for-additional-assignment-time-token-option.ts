import * as t from 'io-ts';
import { ATokenOption, TokenOptionDataDef } from 'app/token-options/token-option';
import { ToJSONMixin } from 'app/token-options/mixins/to-json-mixin';
import { FromDataMixin } from 'app/token-options/mixins/from-data-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import { AssignmentMixin, AssignmentMixinDataDef } from '../mixins/assignment-mixin';
import { MultipleRequestsMixin, MultipleRequestsMixinDataDef } from '../mixins/multiple-requests-mixin';
import {
    ExcludeTokenOptionIdsMixin,
    ExcludeTokenOptionIdsMixinDataDef
} from '../mixins/exclude-token-option-ids-mixin';
import { ChangeAssignmentDatesMixin, ChangeAssignmentDatesMixinDataDef } from '../mixins/change-assignment-dates-mixin';

export const SpendForAdditionalAssignmentTimeTokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    AssignmentMixinDataDef,
    ChangeAssignmentDatesMixinDataDef,
    MultipleRequestsMixinDataDef,
    ExcludeTokenOptionIdsMixinDataDef
]);

export type SpendForAdditionalAssignmentTimeTokenOptionData = t.TypeOf<
    typeof SpendForAdditionalAssignmentTimeTokenOptionDataDef
>;
export type RawSpendForAdditionalAssignmentTimeTokenOptionData = t.OutputOf<
    typeof SpendForAdditionalAssignmentTimeTokenOptionDataDef
>;

class ASpendForAdditionalAssignmentTimeTokenOption extends ATokenOption {}

export class SpendForAdditionalAssignmentTimeTokenOption extends FromDataMixin(
    ToJSONMixin(
        ExcludeTokenOptionIdsMixin(
            MultipleRequestsMixin(
                AssignmentMixin(ChangeAssignmentDatesMixin(ASpendForAdditionalAssignmentTimeTokenOption))
            )
        ),
        SpendForAdditionalAssignmentTimeTokenOptionDataDef.encode
    ),
    unwrapValidationFunc(SpendForAdditionalAssignmentTimeTokenOptionDataDef.decode),
    SpendForAdditionalAssignmentTimeTokenOptionDataDef.is
) {}
