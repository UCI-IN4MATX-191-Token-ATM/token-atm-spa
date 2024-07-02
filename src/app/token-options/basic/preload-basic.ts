import registerTokenOption from '../token-option-register-helper';
import { BasicRequestHandler } from './basic-request-handler';
import { BasicTokenOption } from './basic-token-option';
import { BasicTokenOptionFieldComponentFactory } from './basic-token-option-field-component-factory';

registerTokenOption(BasicTokenOption, {
    order: 0,
    type: 'basic',
    descriptiveName: 'Basic (Always approve; just for testing purpose)',
    requestHandler: BasicRequestHandler,
    componentFactory: BasicTokenOptionFieldComponentFactory
});
