import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TokenOptionRegistry {
    private static DESCRIPTIVE_NAME_REGISTRY: {
        [key: string]: string;
    } = {
        basic: 'Basic (Always approve; just for testing purpose)',
        'earn-by-quiz': 'Earn Tokens by Passing Canvas Quiz',
        'earn-by-module': 'Earn Tokens by Passing Canvas Module',
        'earn-by-survey': 'Earn Tokens by Taking Qualtrics Survey',
        'spend-for-lab-data': 'Spend Tokens for Lab Data',
        'spend-for-assignment-resubmission': 'Spend Tokens for Assignment Resubmission',
        'withdraw-assignment-resubmission': 'Withdraw Assignment Resubmission Request',
        'withdraw-lab-data': 'Withdraw Lab Data Request'
    };

    public getDescriptiveName(tokenOptionType: string): string | undefined {
        return TokenOptionRegistry.DESCRIPTIVE_NAME_REGISTRY[tokenOptionType];
    }

    public getRegisteredTokenOptionsDescriptiveNames(): [string, string][] {
        return Object.entries(TokenOptionRegistry.DESCRIPTIVE_NAME_REGISTRY);
    }
}
