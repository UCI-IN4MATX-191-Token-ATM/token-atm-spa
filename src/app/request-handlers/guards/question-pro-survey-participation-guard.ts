import type { QuestionProService } from 'app/services/question-pro.service';
import type { EarnByQuestionProSurveyTokenOptionData } from 'app/token-options/earn-by-question-pro-survey-token-option';
import { RequestHandlerGuard } from './request-handler-guard';

export class QuestionProSurveyParticipationGuard extends RequestHandlerGuard {
    constructor(
        private surveyId: string,
        private responseField: EarnByQuestionProSurveyTokenOptionData['responseField'],
        private participationId: string,
        private questionProService: QuestionProService
    ) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        if (this.participationId == '') {
            onReject('Your Canvas email address is not visible, please contact your institution for help.');
            return;
        }
        const result = await this.questionProService.checkParticipation(
            this.surveyId,
            this.responseField,
            this.participationId
        );
        if (!result) {
            onReject(
                'You did not complete the survey. Or your default email address on Canvas doesn’t match the email connected with the QuestionPro survey.'
            );
        }
    }
}
