import { Injectable } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { EarnBySurveyTokenOption } from 'app/token-options/earn-by-survey-token-option';
import { TokenOptionResolver } from './token-option-resolver';

@Injectable()
export class EarnBySurveyTokenOptionResolver extends TokenOptionResolver<EarnBySurveyTokenOption> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public resolve(group: TokenOptionGroup, data: any): EarnBySurveyTokenOption {
        return EarnBySurveyTokenOption.deserialize(group, data);
    }
    public get type(): string {
        return 'earn-by-survey';
    }
}
