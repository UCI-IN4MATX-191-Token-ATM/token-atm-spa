import registerTokenOption from '../token-option-register-helper';
import { SpendForAdditionalPointsRequestHandler } from './spend-for-additional-points-request-handler';
import { SpendForAdditionalPointsTokenOption } from './spend-for-additional-points-token-option';
import { SpendForAdditionalPointsTokenOptionFieldComponentFactory } from './spend-for-additional-points-token-option-field-component-factory';

registerTokenOption(SpendForAdditionalPointsTokenOption, {
    order: 14,
    type: 'spend-for-additional-points',
    descriptiveName: 'Spend Tokens for Additional Canvas Assignment Points',
    requestHandler: SpendForAdditionalPointsRequestHandler,
    componentFactory: SpendForAdditionalPointsTokenOptionFieldComponentFactory
});
