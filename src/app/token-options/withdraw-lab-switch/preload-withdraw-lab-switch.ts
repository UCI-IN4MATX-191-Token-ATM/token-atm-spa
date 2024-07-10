import registerTokenOption from '../token-option-register-helper';
import { WithdrawLabSwitchRequestHandler } from './withdraw-lab-switch-request-handler';
import { WithdrawLabSwitchTokenOption } from './withdraw-lab-switch-token-option';
import { WithdrawLabSwitchTokenOptionFieldComponentFactory } from './withdraw-lab-switch-token-option-field-component-factory';

registerTokenOption(WithdrawLabSwitchTokenOption, {
    order: 9,
    type: 'withdraw-lab-switch',
    descriptiveName: 'Withdraw Lab Switch Request (For Teacher Only)',
    requestHandler: WithdrawLabSwitchRequestHandler,
    componentFactory: WithdrawLabSwitchTokenOptionFieldComponentFactory
});
