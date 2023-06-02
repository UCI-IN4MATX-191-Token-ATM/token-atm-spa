import { Inject, Injectable, InjectionToken, Optional, Type } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import type { TokenOption } from 'app/token-options/token-option';
import { BasicTokenOptionResolver } from './basic-token-option-resolver';
import { EarnByModuleTokenOptionResolver } from './earn-by-module-token-option-resolver';
import { EarnByQuizTokenOptionResolver } from './earn-by-quiz-token-option-resolver';
import { SpendForAssignmentResubmissionTokenOptionResolver } from './spend-for-assignment-resubmission-token-option-resolver';
import { SpendForLabDataTokenOptionResolver } from './spend-for-lab-data-token-option-resolver';
import type { TokenOptionResolver } from './token-option-resolver';

export const REGISTERED_TOKEN_OPTION_RESOLVERS: Type<TokenOptionResolver<TokenOption>>[] = [
    BasicTokenOptionResolver,
    EarnByModuleTokenOptionResolver,
    EarnByQuizTokenOptionResolver,
    SpendForAssignmentResubmissionTokenOptionResolver,
    SpendForLabDataTokenOptionResolver
];

export const TOKEN_OPTION_RESOLVER_INJECTION_TOKEN = new InjectionToken<TokenOptionResolver<TokenOption>[]>(
    'TOKEN_OPTION_RESOLVERS'
);

@Injectable({
    providedIn: 'root'
})
export class TokenOptionResolverRegistry {
    private _tokenOptionResolversMap = new Map<string, TokenOptionResolver<TokenOption>>();

    constructor(
        @Optional()
        @Inject(TOKEN_OPTION_RESOLVER_INJECTION_TOKEN)
        tokenOptionResolvers?: TokenOptionResolver<TokenOption>[]
    ) {
        if (tokenOptionResolvers)
            tokenOptionResolvers.forEach((resolver) => {
                this._tokenOptionResolversMap.set(resolver.type, resolver);
            });
    }

    private getTokenOptionResolver(type: string): TokenOptionResolver<TokenOption> {
        const result = this._tokenOptionResolversMap.get(type);
        if (!result) throw new Error('Unsupported token option type');
        return result;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public resolveTokenOption(group: TokenOptionGroup, data: any): TokenOption {
        if (typeof data['type'] != 'string') throw new Error('Invalid data');
        return this.getTokenOptionResolver(data['type']).resolve(group, data);
    }
}
