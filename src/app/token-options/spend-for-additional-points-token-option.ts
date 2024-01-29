import * as t from 'io-ts';
import { AssignmentMixin, AssignmentMixinDataDef } from './mixins/assignment-mixin';
import { ATokenOption, TokenOptionDataDef } from './token-option';
import { FromDataMixin } from './mixins/from-data-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import { ToJSONMixin } from './mixins/to-json-mixin';
import { ExcludeTokenOptionIdsMixin, ExcludeTokenOptionIdsMixinDataDef } from './mixins/exclude-token-option-ids-mixin';
import { MultipleRequestsMixin, MultipleRequestsMixinDataDef } from './mixins/multiple-requests-mixin';
import { AdditionalCanvasScoreMixinDataDef, AdditionalCanvasScoreMixin } from './mixins/additional-canvas-score-mixin';

export const SpendForAdditionalPointsTokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    AssignmentMixinDataDef,
    AdditionalCanvasScoreMixinDataDef,
    MultipleRequestsMixinDataDef,
    ExcludeTokenOptionIdsMixinDataDef
]);

export type SpendForAdditionalPointsTokenOptionData = t.TypeOf<typeof SpendForAdditionalPointsTokenOptionDataDef>;

export class SpendForAdditionalPointsTokenOption extends FromDataMixin(
    ToJSONMixin(
        ExcludeTokenOptionIdsMixin(MultipleRequestsMixin(AdditionalCanvasScoreMixin(AssignmentMixin(ATokenOption)))),
        SpendForAdditionalPointsTokenOptionDataDef.encode
    ),
    unwrapValidationFunc(SpendForAdditionalPointsTokenOptionDataDef.decode),
    SpendForAdditionalPointsTokenOptionDataDef.is
) {}
