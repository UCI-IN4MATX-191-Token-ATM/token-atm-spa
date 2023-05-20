import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { EarnByModuleRequest } from 'app/requests/earn-by-module-request';
import type { EarnByModuleTokenOption } from 'app/token-options/earn-by-module-token-option';
import { RequestResolver } from './request-resolver';

@Injectable()
export class EarnByModuleRequestResolver extends RequestResolver<EarnByModuleTokenOption, EarnByModuleRequest> {
    public async resolve(
        tokenOption: EarnByModuleTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<EarnByModuleRequest> {
        return new EarnByModuleRequest(tokenOption, quizSubmissionDetail.student, quizSubmissionDetail.submittedTime);
    }
    public get type(): string {
        return 'earn-by-module';
    }
}
