import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { WithdrawAssignmentResubmissionRequest } from 'app/requests/withdraw-assignment-resubmission-request';
import type { WithdrawAssignmentResubmissionTokenOption } from 'app/token-options/withdraw-assignment-resubmission-token-option';
import { RequestResolver } from './request-resolver';

@Injectable()
export class WithdrawAssignmentResubmissionRequestResolver extends RequestResolver<
    WithdrawAssignmentResubmissionTokenOption,
    WithdrawAssignmentResubmissionRequest
> {
    public async resolve(
        tokenOption: WithdrawAssignmentResubmissionTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<WithdrawAssignmentResubmissionRequest> {
        return new WithdrawAssignmentResubmissionRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }
    public get type(): string {
        return 'withdraw-assignment-resubmission';
    }
}
