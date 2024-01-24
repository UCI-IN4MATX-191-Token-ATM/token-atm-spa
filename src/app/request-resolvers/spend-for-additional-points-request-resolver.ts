import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { RequestResolver } from './request-resolver';
import type { SpendForAdditionalPointsTokenOption } from 'app/token-options/spend-for-additional-points-token-option';
import { SpendForAdditionalPointsRequest } from 'app/requests/spend-for-additional-points-request';

@Injectable()
export class SpendForAdditionalPointsRequestResolver extends RequestResolver<
    SpendForAdditionalPointsTokenOption,
    SpendForAdditionalPointsRequest
> {
    public async resolve(
        tokenOption: SpendForAdditionalPointsTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<SpendForAdditionalPointsRequest> {
        return new SpendForAdditionalPointsRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }
    public get type(): string {
        return 'spend-for-additional-points';
    }
}
