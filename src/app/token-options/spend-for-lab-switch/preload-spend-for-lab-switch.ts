import registerTokenOption from '../token-option-register-helper';
import { SpendForLabSwitchRequestHandler } from './spend-for-lab-switch-request-handler';
import { SpendForLabSwitchTokenOption } from './spend-for-lab-switch-token-option';
import { SpendForLabSwitchTokenOptionFieldComponentFactory } from './spend-for-lab-switch-token-option-field-component-factory';

registerTokenOption(SpendForLabSwitchTokenOption, {
    order: 8,
    type: 'spend-for-lab-switch',
    descriptiveName: 'Spend Tokens for Switching Lab',
    requestHandler: SpendForLabSwitchRequestHandler,
    componentFactory: SpendForLabSwitchTokenOptionFieldComponentFactory
});
