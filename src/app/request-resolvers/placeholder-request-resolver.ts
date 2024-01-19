import { Injectable } from '@angular/core';
import { RequestResolver } from './request-resolver';
import type { PlaceholderTokenOption } from 'app/token-options/placeholder-token-option';
import { PlaceholderRequest } from 'app/requests/placeholder-request';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';

@Injectable()
export class PlaceholderRequestResolver extends RequestResolver<PlaceholderTokenOption, PlaceholderRequest> {
    public async resolve(
        tokenOption: PlaceholderTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<PlaceholderRequest> {
        return new PlaceholderRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }
    public get type(): string {
        return 'placeholder-token-option';
    }
}
