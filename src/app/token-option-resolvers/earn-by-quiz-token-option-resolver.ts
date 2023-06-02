import { Injectable } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { EarnByQuizTokenOption } from 'app/token-options/earn-by-quiz-token-option';
import { TokenOptionResolver } from './token-option-resolver';

@Injectable()
export class EarnByQuizTokenOptionResolver extends TokenOptionResolver<EarnByQuizTokenOption> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public resolve(group: TokenOptionGroup, data: any): EarnByQuizTokenOption {
        return EarnByQuizTokenOption.deserialize(group, data);
    }
    public get type(): string {
        return 'earn-by-quiz';
    }
}
