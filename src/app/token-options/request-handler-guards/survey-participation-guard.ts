import type { QualtricsService } from 'app/services/qualtrics.service';
import { RequestHandlerGuard } from './request-handler-guard';

export class SurveyParticipationGuard extends RequestHandlerGuard {
    constructor(
        private surveyId: string,
        private fieldName: string,
        private participationId: string,
        private qualtricsService: QualtricsService
    ) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        if (this.participationId == '') {
            onReject('Your Canvas email address is not visible, please contact your institution for help.');
            return;
        }
        const result = await this.qualtricsService.checkParticipation(
            this.surveyId,
            this.fieldName,
            this.participationId
        );
        if (!result) {
            onReject(
                'You did not complete the survey. Or your default email address on Canvas doesn’t match the email connected with the Qualtrics Survey.'
            );
        }
    }
}
