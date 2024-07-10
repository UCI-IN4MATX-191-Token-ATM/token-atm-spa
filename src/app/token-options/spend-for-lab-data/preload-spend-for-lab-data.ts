import registerTokenOption from '../token-option-register-helper';
import { SpendForLabDataRequestHandler } from './spend-for-lab-data-request-handler';
import { SpendForLabDataTokenOption } from './spend-for-lab-data-token-option';
import { SpendForLabDataTokenOptionFieldComponentFactory } from './spend-for-lab-data-token-option-field-component-factory';

registerTokenOption(SpendForLabDataTokenOption, {
    order: 4,
    type: 'spend-for-lab-data',
    descriptiveName: 'Spend Tokens for Lab Data',
    requestHandler: SpendForLabDataRequestHandler,
    componentFactory: SpendForLabDataTokenOptionFieldComponentFactory
});
