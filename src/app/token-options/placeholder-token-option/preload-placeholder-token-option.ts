import registerTokenOption from '../token-option-register-helper';
import { PlaceholderRequestHandler } from './placeholder-request-handler';
import { PlaceholderTokenOption } from './placeholder-token-option';
import { PlaceholderTokenOptionFieldComponentFactory } from './placeholder-token-option-field-component-factory';

registerTokenOption(PlaceholderTokenOption, {
    order: 13,
    type: 'placeholder-token-option',
    descriptiveName: 'Placeholder Token Option',
    requestHandler: PlaceholderRequestHandler,
    componentFactory: PlaceholderTokenOptionFieldComponentFactory
});
