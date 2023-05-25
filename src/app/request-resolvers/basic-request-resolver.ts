import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { BasicRequest } from 'app/requests/basic-request';
import type { BasicTokenOption } from 'app/token-options/basic-token-option';
import { RequestResolver } from './request-resolver';

@Injectable()
export class BasicRequestResolver extends RequestResolver<BasicTokenOption, BasicRequest> {
    public async resolve(
        tokenOption: BasicTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<BasicRequest> {
        return new BasicRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }
    public get type(): string {
        return 'basic';
    }
}
