import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { SpendForAssignmentResubmissionRequest } from 'app/requests/spend-for-assignment-resubmission-request';
import type { SpendForAssignmentResubmissionTokenOption } from 'app/token-options/spend-for-assignment-resubmission-token-option';
import { RequestResolver } from './request-resolver';

@Injectable()
export class SpendForAssignmentResubmissionRequestResolver extends RequestResolver<
    SpendForAssignmentResubmissionTokenOption,
    SpendForAssignmentResubmissionRequest
> {
    public async resolve(
        tokenOption: SpendForAssignmentResubmissionTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<SpendForAssignmentResubmissionRequest> {
        return new SpendForAssignmentResubmissionRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }

    public get type(): string {
        return 'spend-for-assignment-resubmission';
    }
}
