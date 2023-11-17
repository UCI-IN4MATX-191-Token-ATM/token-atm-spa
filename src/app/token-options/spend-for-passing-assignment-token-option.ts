import * as t from 'io-ts';
import { AssignmentMixin, AssignmentMixinDataDef } from './mixins/assignment-mixin';
import { ATokenOption, TokenOptionDataDef } from './token-option';
import { FromDataMixin } from './mixins/from-data-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import { ToJSONMixin } from './mixins/to-json-mixin';
import { GradeThresholdMixin, GradeThresholdMixinDataDef } from './mixins/grade-threshold-mixin';
import { ExcludeTokenOptionIdsMixin, ExcludeTokenOptionIdsMixinDataDef } from './mixins/exclude-token-option-ids-mixin';

export const SpendForPassingAssignmentTokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    AssignmentMixinDataDef,
    GradeThresholdMixinDataDef,
    ExcludeTokenOptionIdsMixinDataDef
]);

export type SpendForPassingAssignmentTokenOptionData = t.TypeOf<typeof SpendForPassingAssignmentTokenOptionDataDef>;

export class SpendForPassingAssignmentTokenOption extends FromDataMixin(
    ToJSONMixin(
        ExcludeTokenOptionIdsMixin(GradeThresholdMixin(AssignmentMixin(ATokenOption))),
        SpendForPassingAssignmentTokenOptionDataDef.encode
    ),
    unwrapValidationFunc(SpendForPassingAssignmentTokenOptionDataDef.decode),
    SpendForPassingAssignmentTokenOptionDataDef.is
) {}
