import { Inject, Injectable, InjectionToken, Optional, Type } from '@angular/core';
import type { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenATMRequest } from 'app/requests/token-atm-request';
import type { TokenOption } from 'app/token-options/token-option';
import { BasicRequestHandler } from './basic-request-handler';
import { EarnByModuleRequestHandler } from './earn-by-module-request-handler';
import type { RequestHandler } from './request-handlers';

type GenericRequestHandler = RequestHandler<TokenOption, TokenATMRequest<TokenOption>>;

export const REGISTERED_REQUEST_HANDLERS: Type<GenericRequestHandler>[] = [
    BasicRequestHandler,
    EarnByModuleRequestHandler
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
