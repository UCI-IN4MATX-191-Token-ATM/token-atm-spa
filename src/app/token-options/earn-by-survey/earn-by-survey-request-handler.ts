import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenATMRequest } from 'app/requests/token-atm-request';
import { QualtricsService } from 'app/services/qualtrics.service';
import type { EarnBySurveyTokenOption } from 'app/token-options/earn-by-survey/earn-by-survey-token-option';
import { EndDateGuard } from '../../request-handlers/guards/end-date-guard';
import { RepeatRequestGuard } from '../../request-handlers/guards/repeat-request-guard';
import { RequestHandlerGuardExecutor } from '../../request-handlers/guards/request-handler-guard-executor';
import { StartDateGuard } from '../../request-handlers/guards/start-date-guard';
import { SurveyParticipationGuard } from '../../request-handlers/guards/survey-participation-guard';
import { RequestHandler } from '../../request-handlers/request-handlers';

type EarnBySurveyRequest = TokenATMRequest<EarnBySurveyTokenOption>;

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
