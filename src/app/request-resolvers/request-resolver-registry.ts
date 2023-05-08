import { Inject, Injectable, InjectionToken, Optional, Type } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import type { TokenATMRequest } from 'app/requests/token-atm-request';
import type { TokenOption } from 'app/token-options/token-option';
import { BasicRequestResolver } from './basic-request-resolver';
import type { RequestResolver } from './request-resolver';

type GenericRequestResolver = RequestResolver<TokenOption, TokenATMRequest<TokenOption>>;

export const REGISTERED_REQUEST_RESOLVERS: Type<GenericRequestResolver>[] = [BasicRequestResolver];

export const REQUEST_RESOLVER_INJECT_TOKEN = new InjectionToken<GenericRequestResolver[]>('REQUEST_RESOLVERS');

@Injectable({
    providedIn: 'root'
})
export class RequestResolverRegistry {
    private _requestResolversMap = new Map<string, GenericRequestResolver>();

    constructor(@Optional() @Inject(REQUEST_RESOLVER_INJECT_TOKEN) requestResolvers?: GenericRequestResolver[]) {
        if (requestResolvers)
            requestResolvers.forEach((resolver) => {
                this._requestResolversMap.set(resolver.type, resolver);
            });
    }

    private getRequestResolver(type: string): GenericRequestResolver {
        const result = this._requestResolversMap.get(type);
        if (!result) throw new Error('Unspported request type');
        return result;
    }

    public resolveRequest(
        tokenOptionGroup: TokenOptionGroup,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<TokenATMRequest<TokenOption>> {
        for (const tokenOption of tokenOptionGroup.tokenOptions) {
            if (tokenOption.prompt != quizSubmissionDetail.answers[0]) continue;
            return this.getRequestResolver(tokenOption.type).resolve(tokenOption, quizSubmissionDetail);
        }
        // TODO: handle empty answer request (should be invalid)
        throw new Error('Invalid request');
    }
}