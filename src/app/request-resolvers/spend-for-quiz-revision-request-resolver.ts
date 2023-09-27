import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { RequestResolver } from './request-resolver';
import type { SpendForQuizRevisionTokenOption } from 'app/token-options/spend-for-quiz-revision-token-option';
import { SpendForQuizRevisionRequest } from 'app/requests/spend-for-quiz-revision-request';

@Injectable()
export class SpendForQuizRevisionRequestResolver extends RequestResolver<
    SpendForQuizRevisionTokenOption,
    SpendForQuizRevisionRequest
> {
    public async resolve(
        tokenOption: SpendForQuizRevisionTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<SpendForQuizRevisionRequest> {
        return new SpendForQuizRevisionRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }

    public get type(): string {
        return 'spend-for-quiz-revision';
    }
}
