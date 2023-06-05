import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { SpendForLabSwitchRequest } from 'app/requests/spend-for-lab-switch-request';
import type { SpendForLabSwitchTokenOption } from 'app/token-options/spend-for-lab-switch-token-option';
import { RequestResolver } from './request-resolver';

@Injectable()
export class SpendForLabSwitchRequestResolver extends RequestResolver<
    SpendForLabSwitchTokenOption,
    SpendForLabSwitchRequest
> {
    public async resolve(
        tokenOption: SpendForLabSwitchTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<SpendForLabSwitchRequest> {
        return new SpendForLabSwitchRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }
    public get type(): string {
        return 'spend-for-lab-switch';
    }
}
