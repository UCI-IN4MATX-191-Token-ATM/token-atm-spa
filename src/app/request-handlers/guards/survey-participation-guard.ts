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
            onReject(
                'Token ATM cannot access your email address, which thus cannot check your participation. Please make your email address visible.'
            );
            return;
        }
        const result = await this.qualtricsService.checkParticipation(
            this.surveyId,
            this.fieldName,
            this.participationId
        );
        if (!result) {
            onReject('You did not complete the survey.');
        }
    }
}
