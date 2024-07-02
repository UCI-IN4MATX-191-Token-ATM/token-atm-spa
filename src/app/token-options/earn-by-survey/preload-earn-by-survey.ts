import registerTokenOption from '../token-option-register-helper';
import { EarnBySurveyRequestHandler } from './earn-by-survey-request-handler';
import { EarnBySurveyTokenOption } from './earn-by-survey-token-option';
import { EarnBySurveyTokenOptionFieldComponentFactory } from './earn-by-survey-token-option-field-component-factory';

registerTokenOption(EarnBySurveyTokenOption, {
    order: 3,
    type: 'earn-by-survey',
    descriptiveName: 'Earn Tokens by Taking Qualtrics Survey',
    requestHandler: EarnBySurveyRequestHandler,
    componentFactory: EarnBySurveyTokenOptionFieldComponentFactory
});
