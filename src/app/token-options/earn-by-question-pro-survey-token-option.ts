import { QUESTION_PRO_CREDENTIAL_KEY } from 'app/credential-handlers/question-pro-credential-handler';
import { RequireCredentials } from 'app/services/credential-manager.service';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import * as t from 'io-ts';
import { EndTimeMixin, EndTimeMixinDataDef } from './mixins/end-time-mixin';
import { FromDataMixin } from './mixins/from-data-mixin';
import { QuestionProSurveyMixin, QuestionProSurveyMixinDataDef } from './mixins/question-pro-survey-mixin';
import { StartTimeMixin, StartTimeMixinDataDef } from './mixins/start-time-mixin';
import { ToJSONMixin } from './mixins/to-json-mixin';
import { ATokenOption, TokenOptionDataDef } from './token-option';

export const EarnByQuestionProSurveyTokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    QuestionProSurveyMixinDataDef,
    StartTimeMixinDataDef,
    EndTimeMixinDataDef
]);

export type EarnByQuestionProSurveyTokenOptionData = t.TypeOf<typeof EarnByQuestionProSurveyTokenOptionDataDef>;

export type RawEarnByQuestionProSurveyTokenOptionData = t.OutputOf<typeof EarnByQuestionProSurveyTokenOptionDataDef>;

@RequireCredentials(QUESTION_PRO_CREDENTIAL_KEY)
export class EarnByQuestionProSurveyTokenOption extends FromDataMixin(
    ToJSONMixin(
        EndTimeMixin(StartTimeMixin(QuestionProSurveyMixin(ATokenOption))),
        EarnByQuestionProSurveyTokenOptionDataDef.encode
    ),
    unwrapValidationFunc(EarnByQuestionProSurveyTokenOptionDataDef.decode),
    EarnByQuestionProSurveyTokenOptionDataDef.is
) {}
