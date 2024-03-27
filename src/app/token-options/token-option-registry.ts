import { Injectable } from '@angular/core';
import type { TokenOption } from './token-option';
import { WithdrawLabSwitchTokenOption } from './withdraw-lab-switch-token-option';
import { BasicTokenOption } from './basic-token-option';
import { EarnByQuizTokenOption } from './earn-by-quiz-token-option';
import { EarnByModuleTokenOption } from './earn-by-module-token-option';
import { EarnBySurveyTokenOption } from './earn-by-survey-token-option';
import { SpendForAssignmentResubmissionTokenOption } from './spend-for-assignment-resubmission-token-option';
import { SpendForLabDataTokenOption } from './spend-for-lab-data-token-option';
import { SpendForLabSwitchTokenOption } from './spend-for-lab-switch-token-option';
import { WithdrawAssignmentResubmissionTokenOption } from './withdraw-assignment-resubmission-token-option';
import { WithdrawLabDataTokenOption } from './withdraw-lab-data-token-option';
import { SpendForQuizRevisionTokenOption } from './spend-for-quiz-revision-token-option';
import { SpendForAssignmentExtensionTokenOption } from './spend-for-assignment-extension-token-option';
import { SpendForPassingAssignmentTokenOption } from './spend-for-passing-assignment-token-option';
import type { Constructor } from 'app/utils/mixin-helper';
import { PlaceholderTokenOption } from './placeholder-token-option';
import { SpendForAdditionalPointsTokenOption } from './spend-for-additional-points-token-option';
import { EarnByQuestionProSurveyTokenOption } from './earn-by-question-pro-survey-token-option';

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
        'spend-for-passing-assignment': 'Spend Tokens for Assignment / Quiz Grade',
        'placeholder-token-option': 'Placeholder Token Option',
        'spend-for-additional-points': 'Spend Tokens for Additional Canvas Assignment Points',
        'earn-by-question-pro-survey': 'Earn Tokens by Taking QuestionPro Survey'
    };

    private static TOKEN_OPTION_CLASS_REGISTRY: {
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
        'spend-for-assignment-extension': SpendForAssignmentExtensionTokenOption,
        'spend-for-passing-assignment': SpendForPassingAssignmentTokenOption,
        'placeholder-token-option': PlaceholderTokenOption,
        'spend-for-additional-points': SpendForAdditionalPointsTokenOption,
        'earn-by-question-pro-survey': EarnByQuestionProSurveyTokenOption
    };

    public getDescriptiveName(tokenOptionType: string): string | undefined {
        return TokenOptionRegistry.DESCRIPTIVE_NAME_REGISTRY[tokenOptionType];
    }

    public getTokenOptionClass(tokenOptionType: string): Constructor<TokenOption> | undefined {
        return TokenOptionRegistry.TOKEN_OPTION_CLASS_REGISTRY[tokenOptionType];
    }

    public getRegisteredTokenOptionsDescriptiveNames(): [string, string][] {
        return Object.entries(TokenOptionRegistry.DESCRIPTIVE_NAME_REGISTRY);
    }

    public canCreateRequestByTeacher(tokenOption: TokenOption): boolean {
        return tokenOption instanceof WithdrawLabSwitchTokenOption;
    }
}
