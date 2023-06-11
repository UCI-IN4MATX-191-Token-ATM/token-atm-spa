import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { SpendForLabDataRequest } from 'app/requests/spend-for-lab-data-request';
import type { SpendForLabDataTokenOption } from 'app/token-options/spend-for-lab-data-token-option';
import { RequestResolver } from './request-resolver';

@Injectable()
export class SpendForLabDataRequestResolver extends RequestResolver<
    SpendForLabDataTokenOption,
    SpendForLabDataRequest
> {
    public async resolve(
        tokenOption: SpendForLabDataTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<SpendForLabDataRequest> {
        return new SpendForLabDataRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }

    public get type(): string {
        return 'spend-for-lab-data';
    }
}
