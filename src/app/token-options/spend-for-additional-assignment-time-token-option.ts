import * as t from 'io-ts';
import { AssignmentMixin, AssignmentMixinDataDef } from './mixins/assignment-mixin';
import { ATokenOption, TokenOptionDataDef } from './token-option';
import { FromDataMixin } from './mixins/from-data-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import { ToJSONMixin } from './mixins/to-json-mixin';
import { MultipleRequestsMixin, MultipleRequestsMixinDataDef } from './mixins/multiple-requests-mixin';
import { ExcludeTokenOptionIdsMixin, ExcludeTokenOptionIdsMixinDataDef } from './mixins/exclude-token-option-ids-mixin';

// TODO: Include Mixins and Data Defs for Durations to add
export const SpendForAdditionalAssignmentTimeTokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    AssignmentMixinDataDef,
    MultipleRequestsMixinDataDef,
    ExcludeTokenOptionIdsMixinDataDef
]);

export type SpendForAdditionalAssignmentTimeTokenOptionData = t.TypeOf<
    typeof SpendForAdditionalAssignmentTimeTokenOptionDataDef
>;
export type RawSpendForAdditionalAssignmentTimeTokenOptionData = t.OutputOf<
    typeof SpendForAdditionalAssignmentTimeTokenOptionDataDef
>;

export class SpendForAdditionalAssignmentTimeTokenOption extends FromDataMixin(
    ToJSONMixin(
        ExcludeTokenOptionIdsMixin(MultipleRequestsMixin(AssignmentMixin(ATokenOption))),
        SpendForAdditionalAssignmentTimeTokenOptionDataDef.encode
    ),
    unwrapValidationFunc(SpendForAdditionalAssignmentTimeTokenOptionDataDef.decode),
    SpendForAdditionalAssignmentTimeTokenOptionDataDef.is
) {}
