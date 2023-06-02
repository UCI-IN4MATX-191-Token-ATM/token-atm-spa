import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { EarnBySurveyRequest } from 'app/requests/earn-by-survey-request';
import type { EarnBySurveyTokenOption } from 'app/token-options/earn-by-survey-token-option';
import { RequestResolver } from './request-resolver';

@Injectable()
export class EarnBySurveyRequestResolver extends RequestResolver<EarnBySurveyTokenOption, EarnBySurveyRequest> {
    public async resolve(
        tokenOption: EarnBySurveyTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<EarnBySurveyRequest> {
        return new EarnBySurveyRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }
    public get type(): string {
        return 'earn-by-survey';
    }
}
