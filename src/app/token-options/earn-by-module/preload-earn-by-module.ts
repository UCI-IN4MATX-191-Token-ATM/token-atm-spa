import registerTokenOption from '../token-option-register-helper';
import { EarnByModuleRequestHandler } from './earn-by-module-request-handler';
import { EarnByModuleTokenOption } from './earn-by-module-token-option';
import { EarnByModuleTokenOptionFieldComponentFactory } from './earn-by-module-token-option-field-component-factory';

registerTokenOption(EarnByModuleTokenOption, {
    order: 2,
    type: 'earn-by-module',
    descriptiveName: 'Earn Tokens by Passing Canvas Module',
    requestHandler: EarnByModuleRequestHandler,
    componentFactory: EarnByModuleTokenOptionFieldComponentFactory
});
