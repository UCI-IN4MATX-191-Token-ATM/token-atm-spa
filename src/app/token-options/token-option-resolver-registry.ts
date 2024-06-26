import { Inject, Injectable, InjectionToken, Optional, Type } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import type { TokenOption } from 'app/token-options/token-option';
import type { TokenOptionResolver } from './token-option-resolver';
import camelcaseKeys from 'camelcase-keys';
// import type { Constructor } from 'app/utils/mixin-helper';
// import { BasicTokenOption } from 'app/token-options/basic-token-option';
// import { EarnByQuizTokenOption } from 'app/token-options/earn-by-quiz-token-option';
// import { EarnByModuleTokenOption } from 'app/token-options/earn-by-module/earn-by-module-token-option';
// import { EarnBySurveyTokenOption } from 'app/token-options/earn-by-survey/earn-by-survey-token-option';
// import { SpendForLabDataTokenOption } from 'app/token-options/spend-for-lab-data/spend-for-lab-data-token-option';
// import { SpendForAssignmentResubmissionTokenOption } from 'app/token-options/spend-for-assignment-resubmission/spend-for-assignment-resubmission-token-option';
// import { SpendForLabSwitchTokenOption } from 'app/token-options/spend-for-lab-switch/spend-for-lab-switch-token-option';
// import { WithdrawAssignmentResubmissionTokenOption } from 'app/token-options/withdraw-assignment-resubmission/withdraw-assignment-resubmission-token-option';
// import { WithdrawLabDataTokenOption } from 'app/token-options/withdraw-lab-data/withdraw-lab-data-token-option';
// import { WithdrawLabSwitchTokenOption } from 'app/token-options/withdraw-lab-switch/withdraw-lab-switch-token-option';
// import { SpendForQuizRevisionTokenOption } from 'app/token-options/spend-for-quiz-revision/spend-for-quiz-revision-token-option';
// import { SpendForAssignmentExtensionTokenOption } from 'app/token-options/spend-for-assignment-extension/spend-for-assignment-extension-token-option';
// import { SpendForPassingAssignmentTokenOption } from 'app/token-options/spend-for-passing-assignment/spend-for-passing-assignment-token-option';
// import { PlaceholderTokenOption } from 'app/token-options/placeholder/placeholder-token-option';
// import { SpendForAdditionalPointsTokenOption } from 'app/token-options/spend-for-additional-points/spend-for-additional-points-token-option';
// import { EarnByQuestionProSurveyTokenOption } from 'app/token-options/earn-by-question-pro-survey/earn-by-question-pro-survey-token-option';

export const REGISTERED_TOKEN_OPTION_RESOLVERS: Type<TokenOptionResolver<TokenOption>>[] = [];

export const TOKEN_OPTION_RESOLVER_INJECTION_TOKEN = new InjectionToken<TokenOptionResolver<TokenOption>[]>(
    'TOKEN_OPTION_RESOLVERS'
);

export const DEFAULT_TOKEN_OPTION_RESOLVERS: {
    [key: string]: Type<TokenOption>;
} = {};

// export const DEFAULT_TOKEN_OPTION_RESOLVERS: {
//     [key: string]: Type<TokenOption>;
// } = {
//     basic: BasicTokenOption,
//     'earn-by-quiz': EarnByQuizTokenOption,
//     'earn-by-module': EarnByModuleTokenOption,
//     'earn-by-survey': EarnBySurveyTokenOption,
//     'spend-for-assignment-resubmission': SpendForAssignmentResubmissionTokenOption,
//     'spend-for-lab-data': SpendForLabDataTokenOption,
//     'spend-for-lab-switch': SpendForLabSwitchTokenOption,
//     'withdraw-assignment-resubmission': WithdrawAssignmentResubmissionTokenOption,
//     'withdraw-lab-data': WithdrawLabDataTokenOption,
//     'withdraw-lab-switch': WithdrawLabSwitchTokenOption,
//     'spend-for-quiz-revision': SpendForQuizRevisionTokenOption,
//     'spend-for-assignment-extension': SpendForAssignmentExtensionTokenOption,
//     'spend-for-passing-assignment': SpendForPassingAssignmentTokenOption,
//     'placeholder-token-option': PlaceholderTokenOption,
//     'spend-for-additional-points': SpendForAdditionalPointsTokenOption,
//     'earn-by-question-pro-survey': EarnByQuestionProSurveyTokenOption
// };

interface ITokenOptionType {
    type: string;
}

@Injectable({
    providedIn: 'root'
})
export class TokenOptionResolverRegistry {
    private _tokenOptionResolversMap = new Map<string, TokenOptionResolver<TokenOption>>();
    private _defaultTokenOptionResolversMap: Map<string, Type<TokenOption>>; // TODO: use object-key map directly to allow dynamic registration?

    constructor(
        @Optional()
        @Inject(TOKEN_OPTION_RESOLVER_INJECTION_TOKEN)
        tokenOptionResolvers?: TokenOptionResolver<TokenOption>[]
    ) {
        if (tokenOptionResolvers)
            tokenOptionResolvers.forEach((resolver) => {
                this._tokenOptionResolversMap.set(resolver.type, resolver);
            });
        this._defaultTokenOptionResolversMap = new Map(Object.entries(DEFAULT_TOKEN_OPTION_RESOLVERS));
    }

    private getTokenOptionResolver(type: string): TokenOptionResolver<TokenOption> {
        const result = this._tokenOptionResolversMap.get(type);
        if (!result) throw new Error('Unsupported token option type: ' + type);
        return result;
    }

    public resolveTokenOption(group: TokenOptionGroup, data: unknown): TokenOption {
        const type = (data as ITokenOptionType).type;
        if (typeof type != 'string') throw new Error('Invalid data');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data = camelcaseKeys(data as any, { deep: true });
        if (this._defaultTokenOptionResolversMap.has(type)) {
            const classDef = this._defaultTokenOptionResolversMap.get(type);
            if (!classDef) throw new Error('Invalid Map');
            const result = new classDef().fromRawData(data);
            result.group = group;
            return result;
        }
        return this.getTokenOptionResolver((data as ITokenOptionType).type).resolve(group, data);
    }

    public constructTokenOption(group: TokenOptionGroup, data: unknown, isValidated = false): TokenOption {
        const type = (data as ITokenOptionType).type;
        if (typeof type != 'string') throw new Error('Invalid data');
        if (this._defaultTokenOptionResolversMap.has(type)) {
            const classDef = this._defaultTokenOptionResolversMap.get(type);
            if (!classDef) throw new Error('Invalid Map');
            const result = new classDef().fromData(data, isValidated);
            result.group = group;
            return result;
        }
        return this.getTokenOptionResolver((data as ITokenOptionType).type).construct(group, data);
    }

    public static registerDefaultTokenOptionResolver(tokenOptionClass: Type<TokenOption>, type: string) {
        DEFAULT_TOKEN_OPTION_RESOLVERS[type] = tokenOptionClass;
    }

    public static registerTokenOptionResolver<T extends TokenOption>(resolver: Type<TokenOptionResolver<T>>) {
        REGISTERED_TOKEN_OPTION_RESOLVERS.push(resolver);
    }
}
