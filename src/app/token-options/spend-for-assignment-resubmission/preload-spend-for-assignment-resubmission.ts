import registerTokenOption from '../token-option-register-helper';
import { SpendForAssignmentResubmissionRequestHandler } from './spend-for-assignment-resubmission-request-handler';
import { SpendForAssignmentResubmissionTokenOption } from './spend-for-assignment-resubmission-token-option';
import { SpendForAssignmentResubmissionTokenOptionFieldComponentFactory } from './spend-for-assignment-resubmission-token-option-field-component-factory';

registerTokenOption(SpendForAssignmentResubmissionTokenOption, {
    order: 5,
    type: 'spend-for-assignment-resubmission',
    descriptiveName: 'Spend Tokens for Assignment Resubmission on Canvas',
    requestHandler: SpendForAssignmentResubmissionRequestHandler,
    componentFactory: SpendForAssignmentResubmissionTokenOptionFieldComponentFactory
});
