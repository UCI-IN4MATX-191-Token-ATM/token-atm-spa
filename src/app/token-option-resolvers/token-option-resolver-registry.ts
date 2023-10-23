import { Inject, Injectable, InjectionToken, Optional, Type } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import type { TokenOption } from 'app/token-options/token-option';
import type { Constructor } from 'app/utils/mixin-helper';
import { BasicTokenOption } from 'app/token-options/basic-token-option';
import { EarnByQuizTokenOption } from 'app/token-options/earn-by-quiz-token-option';
import { EarnByModuleTokenOption } from 'app/token-options/earn-by-module-token-option';
import { EarnBySurveyTokenOption } from 'app/token-options/earn-by-survey-token-option';
import { SpendForLabDataTokenOption } from 'app/token-options/spend-for-lab-data-token-option';
import { SpendForAssignmentResubmissionTokenOption } from 'app/token-options/spend-for-assignment-resubmission-token-option';
import { SpendForLabSwitchTokenOption } from 'app/token-options/spend-for-lab-switch-token-option';
import { WithdrawAssignmentResubmissionTokenOption } from 'app/token-options/withdraw-assignment-resubmission-token-option';
import { WithdrawLabDataTokenOption } from 'app/token-options/withdraw-lab-data-token-option';
import { WithdrawLabSwitchTokenOption } from 'app/token-options/withdraw-lab-switch-token-option';
import type { TokenOptionResolver } from './token-option-resolver';
import camelcaseKeys from 'camelcase-keys';
import { SpendForQuizRevisionTokenOption } from 'app/token-options/spend-for-quiz-revision-token-option';
import { SpendForAssignmentExtensionTokenOption } from 'app/token-options/spend-for-assignment-extension-token-option';

export const REGISTERED_TOKEN_OPTION_RESOLVERS: Type<TokenOptionResolver<TokenOption>>[] = [];

export const TOKEN_OPTION_RESOLVER_INJECTION_TOKEN = new InjectionToken<TokenOptionResolver<TokenOption>[]>(
    'TOKEN_OPTION_RESOLVERS'
);

export const DEFAULT_TOKEN_OPTION_RESOLVERS: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: Constructor<TokenOption>;
} = {
    basic: BasicTokenOption,
    'earn-by-quiz': EarnByQuizTokenOption,
    'earn-by-module': EarnByModuleTokenOption,
    'earn-by-survey': EarnBySurveyTokenOption,
    'spend-for-assignment-resubmission': SpendForAssignmentResubmissionTokenOption,
    'spend-for-lab-data': SpendForLabDataTokenOption,
    'spend-for-lab-switch': SpendForLabSwitchTokenOption,
    'withdraw-assignment-resubmission': WithdrawAssignmentResubmissionTokenOption,
    'withdraw-lab-data': WithdrawLabDataTokenOption,
    'withdraw-lab-switch': WithdrawLabSwitchTokenOption,
    'spend-for-quiz-revision': SpendForQuizRevisionTokenOption,
    'spend-for-assignment-extension': SpendForAssignmentExtensionTokenOption
};

interface ITokenOptionType {
    type: string;
}

@Injectable({
    providedIn: 'root'
})
export class TokenOptionResolverRegistry {
    private _tokenOptionResolversMap = new Map<string, TokenOptionResolver<TokenOption>>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _defaultTokenOptionResolversMap: Map<string, Constructor<TokenOption>>;

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
        if (!result) throw new Error('Unsupported token option type');
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
}
