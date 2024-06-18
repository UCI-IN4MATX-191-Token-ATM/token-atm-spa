import registerTokenOption from '../token-option-register-helper';
import { EarnByQuizRequestHandler } from './earn-by-quiz-request-handler';
import { EarnByQuizTokenOption } from './earn-by-quiz-token-option';
import { EarnByQuizTokenOptionFieldComponentFactory } from './earn-by-quiz-token-option-field-component-factory';

registerTokenOption(EarnByQuizTokenOption, {
    order: 1,
    type: 'earn-by-quiz',
    descriptiveName: 'Earn Tokens by Passing Canvas Quiz',
    requestHandler: EarnByQuizRequestHandler,
    componentFactory: EarnByQuizTokenOptionFieldComponentFactory
});
