import registerTokenOption from '../token-option-register-helper';
import { WithdrawAssignmentResubmissionRequestHandler } from './withdraw-assignment-resubmission-request-handler';
import { WithdrawAssignmentResubmissionTokenOption } from './withdraw-assignment-resubmission-token-option';
import { WithdrawAssignmentResubmissionTokenOptionFieldComponentFactory } from './withdraw-assignment-resubmission-token-option-field-component-factory';

registerTokenOption(WithdrawAssignmentResubmissionTokenOption, {
    order: 6,
    type: 'withdraw-assignment-resubmission',
    descriptiveName: 'Withdraw Assignment Resubmission on Canvas Request',
    requestHandler: WithdrawAssignmentResubmissionRequestHandler,
    componentFactory: WithdrawAssignmentResubmissionTokenOptionFieldComponentFactory
});
