import { Injectable } from '@angular/core';
import type { TokenOption } from './token-option';
import { WithdrawLabSwitchTokenOption } from './withdraw-lab-switch-token-option';

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
        'spend-for-assignment-resubmission': 'Spend Tokens for Assignment Resubmission on Canvas',
        'withdraw-assignment-resubmission': 'Withdraw Assignment Resubmission on Canvas Request',
        'withdraw-lab-data': 'Withdraw Lab Data Request',
        'spend-for-lab-switch': 'Spend Tokens for Switching Lab',
        'withdraw-lab-switch': 'Withdraw Lab Switch Request (For Teacher Only)',
        'spend-for-quiz-revision': 'Spend Tokens for Revision Assignment on Canvas after not passing Canvas Quiz',
        'spend-for-assignment-extension': 'Spend Tokens for Canvas Assignment Extension (No Longer Marked Late)',
        'spend-for-passing-assignment': 'Spend Tokens for Assignment / Quiz Grade'
    };

    public getDescriptiveName(tokenOptionType: string): string | undefined {
        return TokenOptionRegistry.DESCRIPTIVE_NAME_REGISTRY[tokenOptionType];
    }

    public getRegisteredTokenOptionsDescriptiveNames(): [string, string][] {
        return Object.entries(TokenOptionRegistry.DESCRIPTIVE_NAME_REGISTRY);
    }

    public canCreateRequestByTeacher(tokenOption: TokenOption): boolean {
        return tokenOption instanceof WithdrawLabSwitchTokenOption;
    }
}
