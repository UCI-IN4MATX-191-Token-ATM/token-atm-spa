import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { EarnBySurveyRequest } from 'app/requests/earn-by-survey-request';
import { QualtricsService } from 'app/services/qualtrics.service';
import type { EarnBySurveyTokenOption } from 'app/token-options/earn-by-survey-token-option';
import { EndDateGuard } from './guards/end-date-guard';
import { RepeatRequestGuard } from './guards/repeat-request-guard';
import { RequestHandlerGuardExecutor } from './guards/request-handler-guard-executor';
import { StartDateGuard } from './guards/start-date-guard';
import { SurveyParticipationGuard } from './guards/survey-participation-guard';
import { RequestHandler } from './request-handlers';

@Injectable()
export class EarnBySurveyRequestHandler extends RequestHandler<EarnBySurveyTokenOption, EarnBySurveyRequest> {
    constructor(@Inject(QualtricsService) private qualtricsService: QualtricsService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: EarnBySurveyRequest
    ): Promise<ProcessedRequest> {
        const guardExecutor = new RequestHandlerGuardExecutor([
            new StartDateGuard(request.submittedTime, request.tokenOption.startTime),
            new EndDateGuard(request.submittedTime, request.tokenOption.endTime),
            new RepeatRequestGuard(request.tokenOption, studentRecord.processedRequests),
            new SurveyParticipationGuard(
                request.tokenOption.surveyId,
                request.tokenOption.fieldName,
                studentRecord.student.email,
                this.qualtricsService
            )
        ]);
        await guardExecutor.check();
        return new ProcessedRequest(
            configuration,
            request.tokenOption.id,
            request.tokenOption.name,
            request.student,
            !guardExecutor.isRejected,
            request.submittedTime,
            new Date(),
            guardExecutor.isRejected ? 0 : request.tokenOption.tokenBalanceChange,
            guardExecutor.message,
            request.tokenOption.group.id
        );
    }

    public get type(): string {
        return 'earn-by-survey';
    }
}
