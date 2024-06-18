import registerTokenOption from '../token-option-register-helper';
import { SpendForAssignmentExtensionRequestHandler } from './spend-for-assignment-extension-request-handler';
import { SpendForAssignmentExtensionTokenOption } from './spend-for-assignment-extension-token-option';
import { SpendForAssignmentExtensionTokenOptionFieldComponentFactory } from './spend-for-assignment-extension-token-option-field-component-factory';

registerTokenOption(SpendForAssignmentExtensionTokenOption, {
    order: 11,
    type: 'spend-for-assignment-extension',
    descriptiveName: 'Spend Tokens for Canvas Assignment Extension (No Longer Marked Late)',
    requestHandler: SpendForAssignmentExtensionRequestHandler,
    componentFactory: SpendForAssignmentExtensionTokenOptionFieldComponentFactory
});
