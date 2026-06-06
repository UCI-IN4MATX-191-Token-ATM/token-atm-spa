import registerTokenOption from 'app/token-options/token-option-register-helper';
import { SpendForAdditionalAssignmentTimeTokenOption } from './spend-for-additional-assignment-time-token-option';
import { SpendForAdditionalAssignmentTimeTokenOptionFieldComponentFactory } from './spend-for-additional-assignment-time-token-option-field-component-factory';
import { SpendForAdditionalAssignmentTimeRequestHandler } from './spend-for-additional-assignment-time-request-handler';

registerTokenOption(SpendForAdditionalAssignmentTimeTokenOption, {
    order: 16,
    type: 'spend-for-additional-assignment-time',
    descriptiveName: 'Spend Tokens for Additional Canvas Assignment Time',
    requestHandler: SpendForAdditionalAssignmentTimeRequestHandler,
    componentFactory: SpendForAdditionalAssignmentTimeTokenOptionFieldComponentFactory
});
