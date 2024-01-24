import { Inject, Injectable, InjectionToken, Optional, Type } from '@angular/core';
import type { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenATMRequest } from 'app/requests/token-atm-request';
import type { TokenOption } from 'app/token-options/token-option';
import { BasicRequestHandler } from './basic-request-handler';
import { EarnByModuleRequestHandler } from './earn-by-module-request-handler';
import { EarnByQuizRequestHandler } from './earn-by-quiz-request-handler';
import { EarnBySurveyRequestHandler } from './earn-by-survey-request-handler';
import type { RequestHandler } from './request-handlers';
import { SpendForAssignmentResubmissionRequestHandler } from './spend-for-assignment-resubmission-request-handler';
import { SpendForLabDataRequestHandler } from './spend-for-lab-data-request-handler';
import { SpendForLabSwitchRequestHandler } from './spend-for-lab-switch-request-handler';
import { WithdrawAssignmentResubmissionRequestHandler } from './withdraw-assignment-resubmission-request-handler';
import { WithdrawLabDataRequestHandler } from './withdraw-lab-data-request-handler';
import { WithdrawLabSwitchRequestHandler } from './withdraw-lab-switch-request-handler';
import { SpendForQuizRevisionRequestHandler } from './spend-for-quiz-revision-request-handler';
import { SpendForAssignmentExtensionRequestHandler } from './spend-for-assignment-extension-request-handler';
import { SpendForPassingAssignmentRequestHandler } from './spend-for-passing-assignment-request-handler';
import { PlaceholderRequestHandler } from './placeholder-request-handler';
import { SpendForAdditionalPointsRequestHandler } from './spend-for-additional-points-request-handler';

type GenericRequestHandler = RequestHandler<TokenOption, TokenATMRequest<TokenOption>>;

export const REGISTERED_REQUEST_HANDLERS: Type<GenericRequestHandler>[] = [
    BasicRequestHandler,
    EarnByModuleRequestHandler,
    EarnByQuizRequestHandler,
    SpendForAssignmentResubmissionRequestHandler,
    SpendForLabDataRequestHandler,
    EarnBySurveyRequestHandler,
    WithdrawAssignmentResubmissionRequestHandler,
    WithdrawLabDataRequestHandler,
    SpendForLabSwitchRequestHandler,
    WithdrawLabSwitchRequestHandler,
    SpendForQuizRevisionRequestHandler,
    SpendForAssignmentExtensionRequestHandler,
    SpendForPassingAssignmentRequestHandler,
    PlaceholderRequestHandler,
    SpendForAdditionalPointsRequestHandler
];

export const REQUEST_HANDLER_INJECT_TOKEN = new InjectionToken<GenericRequestHandler[]>('REQUEST_HANDLERS');

@Injectable({
    providedIn: 'root'
})
export class RequestHandlerRegistry {
    private _requestHandlersMap = new Map<string, GenericRequestHandler>();

    constructor(@Optional() @Inject(REQUEST_HANDLER_INJECT_TOKEN) requestHandlers?: GenericRequestHandler[]) {
        if (requestHandlers)
            requestHandlers.forEach((handler) => {
                this._requestHandlersMap.set(handler.type, handler);
            });
    }

    private getRequestHandler(type: string): GenericRequestHandler {
        const result = this._requestHandlersMap.get(type);
        if (!result) throw new Error('Unsupported request type');
        return result;
    }

    public handleRequest(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: TokenATMRequest<TokenOption>
    ): Promise<ProcessedRequest> {
        return this.getRequestHandler(request.type).handle(configuration, studentRecord, request);
    }
}
