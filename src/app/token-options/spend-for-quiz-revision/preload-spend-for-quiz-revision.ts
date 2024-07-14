import registerTokenOption from '../token-option-register-helper';
import { SpendForQuizRevisionRequestHandler } from './spend-for-quiz-revision-request-handler';
import { SpendForQuizRevisionTokenOption } from './spend-for-quiz-revision-token-option';
import { SpendForQuizRevisionTokenOptionFieldComponentFactory } from './spend-for-quiz-revision-token-option-field-component-factory';

registerTokenOption(SpendForQuizRevisionTokenOption, {
    order: 10,
    type: 'spend-for-quiz-revision',
    descriptiveName: 'Spend Tokens for Revision Assignment on Canvas after not passing Canvas Quiz',
    requestHandler: SpendForQuizRevisionRequestHandler,
    componentFactory: SpendForQuizRevisionTokenOptionFieldComponentFactory
});
