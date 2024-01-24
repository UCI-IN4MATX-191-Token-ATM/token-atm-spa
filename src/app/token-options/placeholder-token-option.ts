import * as t from 'io-ts';
import { ATokenOption, TokenOptionDataDef } from './token-option';
import { FromDataMixin } from './mixins/from-data-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import { ToJSONMixin } from './mixins/to-json-mixin';
import {
    OptionalMultipleSectionStartTimeMixin,
    OptionalMultipleSectionStartTimeMixinDataDef
} from './mixins/optional-multiple-section-start-time-mixin';
import {
    OptionalMultipleSectionEndTimeMixin,
    OptionalMultipleSectionEndTimeMixinDataDef
} from './mixins/optional-multiple-section-end-time-mixin';
import { MultipleRequestsMixin, MultipleRequestsMixinDataDef } from './mixins/multiple-requests-mixin';
import { ExcludeTokenOptionIdsMixin, ExcludeTokenOptionIdsMixinDataDef } from './mixins/exclude-token-option-ids-mixin';

export const PlaceholderTokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    OptionalMultipleSectionStartTimeMixinDataDef,
    OptionalMultipleSectionEndTimeMixinDataDef,
    MultipleRequestsMixinDataDef,
    ExcludeTokenOptionIdsMixinDataDef
]);

export type PlaceholderTokenOptionData = t.TypeOf<typeof PlaceholderTokenOptionDataDef>;

export class PlaceholderTokenOption extends FromDataMixin(
    ToJSONMixin(
        ExcludeTokenOptionIdsMixin(
            MultipleRequestsMixin(
                OptionalMultipleSectionEndTimeMixin(OptionalMultipleSectionStartTimeMixin(ATokenOption))
            )
        ),
        PlaceholderTokenOptionDataDef.encode
    ),
    unwrapValidationFunc(PlaceholderTokenOptionDataDef.decode),
    PlaceholderTokenOptionDataDef.is
) {}
