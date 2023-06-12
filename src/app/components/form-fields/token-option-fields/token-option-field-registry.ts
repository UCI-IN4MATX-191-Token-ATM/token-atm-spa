import { Injectable, Type } from '@angular/core';
import { BasicTokenOptionFieldComponent } from './basic-token-option-field/basic-token-option-field.component';
import { EarnByModuleTokenOptionFieldComponent } from './earn-by-module-token-option-field/earn-by-module-token-option-field.component';
import { EarnByQuizTokenOptionFieldComponent } from './earn-by-quiz-token-option-field/earn-by-quiz-token-option-field.component';
import { EarnBySurveyTokenOptionFieldComponent } from './earn-by-survey-token-option-field/earn-by-survey-token-option-field.component';
import { SpendForAssignmentResubmissionTokenOptionFieldComponent } from './spend-for-assignment-resubmission-token-option-field/spend-for-assignment-resubmission-token-option-field.component';
import { SpendForLabDataTokenOptionFieldComponent } from './spend-for-lab-data-token-option-field/spend-for-lab-data-token-option-field.component';
import type { TokenOptionField } from './token-option-field';

@Injectable({
    providedIn: 'root'
})
export class TokenOptionFieldRegistry {
    private static REGISTRY: {
        [key: string]: Type<TokenOptionField>;
    } = {
        basic: BasicTokenOptionFieldComponent,
        'earn-by-quiz': EarnByQuizTokenOptionFieldComponent,
        'earn-by-module': EarnByModuleTokenOptionFieldComponent,
        'earn-by-survey': EarnBySurveyTokenOptionFieldComponent,
        'spend-for-lab-data': SpendForLabDataTokenOptionFieldComponent,
        'spend-for-assignment-resubmission': SpendForAssignmentResubmissionTokenOptionFieldComponent
    };

    public getComponentType(tokenOptionType: string): Type<TokenOptionField> | undefined {
        return TokenOptionFieldRegistry.REGISTRY[tokenOptionType];
    }
}
