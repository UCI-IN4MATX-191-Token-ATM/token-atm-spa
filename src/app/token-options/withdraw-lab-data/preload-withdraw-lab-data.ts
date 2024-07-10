import registerTokenOption from '../token-option-register-helper';
import { WithdrawLabDataRequestHandler } from './withdraw-lab-data-request-handler';
import { WithdrawLabDataTokenOption } from './withdraw-lab-data-token-option';
import { WithdrawLabDataTokenOptionFieldComponentFactory } from './withdraw-lab-data-token-option-field-component-factory';

registerTokenOption(WithdrawLabDataTokenOption, {
    order: 7,
    type: 'withdraw-lab-data',
    descriptiveName: 'Withdraw Lab Data Request',
    requestHandler: WithdrawLabDataRequestHandler,
    componentFactory: WithdrawLabDataTokenOptionFieldComponentFactory
});
