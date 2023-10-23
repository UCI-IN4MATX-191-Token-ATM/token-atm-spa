import * as t from 'io-ts';
import { ATokenOption, TokenOptionDataDef } from './token-option';
import { QuizMixin, QuizMixinDataDef } from './mixins/quiz-mixin';
import { GradeThresholdMixin, GradeThresholdMixinDataDef } from './mixins/grade-threshold-mixin';
import { AssignmentMixin, AssignmentMixinDataDef } from './mixins/assignment-mixin';
import { FromDataMixin } from './mixins/from-data-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import { ToJSONMixin } from './mixins/to-json-mixin';
import { NewDueTimeMixin, NewDueTimeMixinDataDef } from './mixins/new-due-time-mixin';
import { EndTimeMixin, EndTimeMixinDataDef } from './mixins/end-time-mixin';

export const SpendForQuizRevisionTokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    QuizMixinDataDef,
    GradeThresholdMixinDataDef,
    AssignmentMixinDataDef,
    t.intersection([EndTimeMixinDataDef, NewDueTimeMixinDataDef])
]);

export type SpendForQuizRevisionTokenOptionData = t.TypeOf<typeof SpendForQuizRevisionTokenOptionDataDef>;

export class SpendForQuizRevisionTokenOption extends FromDataMixin(
    ToJSONMixin(
        NewDueTimeMixin(EndTimeMixin(AssignmentMixin(GradeThresholdMixin(QuizMixin(ATokenOption))))),
        SpendForQuizRevisionTokenOptionDataDef.encode
    ),
    unwrapValidationFunc(SpendForQuizRevisionTokenOptionDataDef.decode),
    SpendForQuizRevisionTokenOptionDataDef.is
) {}
