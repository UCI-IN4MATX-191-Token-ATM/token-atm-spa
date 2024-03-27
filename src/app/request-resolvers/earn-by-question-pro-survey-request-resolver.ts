import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { EarnByQuestionProSurveyRequest } from 'app/requests/earn-by-question-pro-survey-request';
import type { EarnByQuestionProSurveyTokenOption } from 'app/token-options/earn-by-question-pro-survey-token-option';
import { RequestResolver } from './request-resolver';

@Injectable()
export class EarnByQuestionProSurveyRequestResolver extends RequestResolver<
    EarnByQuestionProSurveyTokenOption,
    EarnByQuestionProSurveyRequest
> {
    public async resolve(
        tokenOption: EarnByQuestionProSurveyTokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<EarnByQuestionProSurveyRequest> {
        return new EarnByQuestionProSurveyRequest(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }
    public get type(): string {
        return 'earn-by-question-pro-survey';
    }
}
