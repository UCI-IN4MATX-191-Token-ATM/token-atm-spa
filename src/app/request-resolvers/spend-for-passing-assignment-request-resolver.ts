import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { RequestResolver } from './request-resolver';
import type { SpendForPassingAssignmentTokenOption } from 'app/token-options/spend-for-passing-assignment-token-option';
import { SpendForPassingAssignmentRequest } from 'app/requests/spend-for-passing-assignment-request';

@Injectable()
export class SpendForPassingAssignmentRequestResolver extends RequestResolver<
    SpendForPassingAssignmentTokenOption,
    SpendForPassingAssignmentRequest
> {
    public async resolve(
        tokenOption: SpendForPassingAssignmentTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<SpendForPassingAssignmentRequest> {
        return new SpendForPassingAssignmentRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }

    public get type(): string {
        return 'spend-for-passing-assignment';
    }
}
