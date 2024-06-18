import registerTokenOption from '../token-option-register-helper';
import { SpendForPassingAssignmentRequestHandler } from './spend-for-passing-assignment-request-handler';
import { SpendForPassingAssignmentTokenOption } from './spend-for-passing-assignment-token-option';
import { SpendForPassingAssignmentTokenOptionFieldComponentFactory } from './spend-for-passing-assignment-token-option-field-component-factory';

registerTokenOption(SpendForPassingAssignmentTokenOption, {
    order: 12,
    type: 'spend-for-passing-assignment',
    descriptiveName: 'Spend Tokens for Assignment / Quiz Grade',
    requestHandler: SpendForPassingAssignmentRequestHandler,
    componentFactory: SpendForPassingAssignmentTokenOptionFieldComponentFactory
});
