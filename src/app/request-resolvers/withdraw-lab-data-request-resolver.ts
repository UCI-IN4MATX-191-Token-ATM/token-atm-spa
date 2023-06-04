import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { WithdrawLabDataRequest } from 'app/requests/withdraw-lab-data-request';
import type { WithdrawLabDataTokenOption } from 'app/token-options/withdraw-lab-data-token-option';
import { RequestResolver } from './request-resolver';

@Injectable()
export class WithdrawLabDataRequestResolver extends RequestResolver<
    WithdrawLabDataTokenOption,
    WithdrawLabDataRequest
> {
    public async resolve(
        tokenOption: WithdrawLabDataTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<WithdrawLabDataRequest> {
        return new WithdrawLabDataRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }
    public get type(): string {
        return 'withdraw-lab-data';
    }
}
