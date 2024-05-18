import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { SpendForAdditionalAssignmentTimeRequest } from 'app/requests/spend-for-additional-assignment-time-request';
import type { SpendForAdditionalAssignmentTimeTokenOption } from 'app/token-options/spend-for-additional-assignment-time-token-option';
import { RequestResolver } from './request-resolver';

@Injectable()
export class SpendForAdditionalAssignmentTimeRequestResolver extends RequestResolver<
    SpendForAdditionalAssignmentTimeTokenOption,
    SpendForAdditionalAssignmentTimeRequest
> {
    public async resolve(
        tokenOption: SpendForAdditionalAssignmentTimeTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<SpendForAdditionalAssignmentTimeRequest> {
        return new SpendForAdditionalAssignmentTimeRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }

    public get type(): string {
        return 'spend-for-additional-assignment-time';
    }
}
