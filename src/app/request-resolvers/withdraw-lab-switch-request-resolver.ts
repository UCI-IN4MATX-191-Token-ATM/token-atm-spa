import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { WithdrawLabSwitchRequest } from 'app/requests/withdraw-lab-switch-request';
import type { WithdrawLabSwitchTokenOption } from 'app/token-options/withdraw-lab-switch-token-option';
import { RequestResolver } from './request-resolver';

@Injectable()
export class WithdrawLabSwitchRequestResolver extends RequestResolver<
    WithdrawLabSwitchTokenOption,
    WithdrawLabSwitchRequest
> {
    public async resolve(
        tokenOption: WithdrawLabSwitchTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<WithdrawLabSwitchRequest> {
        return new WithdrawLabSwitchRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }
    public get type(): string {
        return 'withdraw-lab-switch';
    }
}
