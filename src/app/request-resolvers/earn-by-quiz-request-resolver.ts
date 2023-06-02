import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { EarnByQuizRequest } from 'app/requests/earn-by-quiz-request';
import type { EarnByQuizTokenOption } from 'app/token-options/earn-by-quiz-token-option';
import { RequestResolver } from './request-resolver';

@Injectable()
export class EarnByQuizRequestResolver extends RequestResolver<EarnByQuizTokenOption, EarnByQuizRequest> {
    public async resolve(
        tokenOption: EarnByQuizTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<EarnByQuizRequest> {
        return new EarnByQuizRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }
    public get type(): string {
        return 'earn-by-quiz';
    }
}
