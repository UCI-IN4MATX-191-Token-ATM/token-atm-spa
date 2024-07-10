import registerTokenOption from '../token-option-register-helper';
import { EarnByQuestionProSurveyRequestHandler } from './earn-by-question-pro-survey-request-handler';
import { EarnByQuestionProSurveyTokenOption } from './earn-by-question-pro-survey-token-option';
import { EarnByQuestionProSurveyTokenOptionFieldComponentFactory } from './earn-by-question-pro-survey-token-option-field-component-factory';

registerTokenOption(EarnByQuestionProSurveyTokenOption, {
    order: 15,
    type: 'earn-by-question-pro-survey',
    descriptiveName: 'Earn Tokens by Taking QuestionPro Survey',
    requestHandler: EarnByQuestionProSurveyRequestHandler,
    componentFactory: EarnByQuestionProSurveyTokenOptionFieldComponentFactory
});
