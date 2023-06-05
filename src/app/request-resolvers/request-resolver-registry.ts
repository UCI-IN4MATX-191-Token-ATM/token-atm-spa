import { Inject, Injectable, InjectionToken, Optional, Type } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import type { TokenATMRequest } from 'app/requests/token-atm-request';
import type { TokenOption } from 'app/token-options/token-option';
import { BasicRequestResolver } from './basic-request-resolver';
import { EarnByModuleRequestResolver } from './earn-by-module-request-resolver';
import { EarnByQuizRequestResolver } from './earn-by-quiz-request-resolver';
import { EarnBySurveyRequestResolver } from './earn-by-survey-request-resolver';
import type { RequestResolver } from './request-resolver';
import { SpendForAssignmentResubmissionRequestResolver } from './spend-for-assignment-resubmission-request-resolver';
import { SpendForLabDataRequestResolver } from './spend-for-lab-data-request-resolver';
import { SpendForLabSwitchRequestResolver } from './spend-for-lab-switch-request-resolver';
import { WithdrawAssignmentResubmissionRequestResolver } from './withdraw-assignment-resubmission-request-resolver';
import { WithdrawLabDataRequestResolver } from './withdraw-lab-data-request-resolver';
import { WithdrawLabSwitchRequestResolver } from './withdraw-lab-switch-request-resolver';

type GenericRequestResolver = RequestResolver<TokenOption, TokenATMRequest<TokenOption>>;

export const REGISTERED_REQUEST_RESOLVERS: Type<GenericRequestResolver>[] = [
    BasicRequestResolver,
    EarnByModuleRequestResolver,
    EarnByQuizRequestResolver,
    SpendForAssignmentResubmissionRequestResolver,
    SpendForLabDataRequestResolver,
    EarnBySurveyRequestResolver,
    WithdrawAssignmentResubmissionRequestResolver,
    WithdrawLabDataRequestResolver,
    SpendForLabSwitchRequestResolver,
    WithdrawLabSwitchRequestResolver
];

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

    public async resolveRequest(
        tokenOptionGroup: TokenOptionGroup,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<TokenATMRequest<TokenOption> | undefined> {
        if (quizSubmissionDetail.answers[0] == '') return undefined;
        for (const tokenOption of tokenOptionGroup.tokenOptions) {
            if (tokenOption.prompt != quizSubmissionDetail.answers[0]) continue;
            return this.getRequestResolver(tokenOption.type).resolve(tokenOption, quizSubmissionDetail);
        }
        return undefined;
    }
}
