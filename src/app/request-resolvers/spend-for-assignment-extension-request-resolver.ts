import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { RequestResolver } from './request-resolver';
import type { SpendForAssignmentExtensionTokenOption } from 'app/token-options/spend-for-assignment-extension-token-option';
import { SpendForAssignmentExtensionRequest } from 'app/requests/spend-for-assignment-extension-request';

@Injectable()
export class SpendForAssignmentExtensionRequestResolver extends RequestResolver<
    SpendForAssignmentExtensionTokenOption,
    SpendForAssignmentExtensionRequest
> {
    public async resolve(
        tokenOption: SpendForAssignmentExtensionTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<SpendForAssignmentExtensionRequest> {
        return new SpendForAssignmentExtensionRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }

    public get type(): string {
        return 'spend-for-assignment-extension';
    }
}
