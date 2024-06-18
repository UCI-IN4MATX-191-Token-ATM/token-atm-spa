import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenATMRequest } from 'app/requests/token-atm-request';
import { QuestionProService } from 'app/services/question-pro.service';
// import { QuestionProService } from 'app/services/question-pro.service';
import type { EarnByQuestionProSurveyTokenOption } from 'app/token-options/earn-by-question-pro-survey/earn-by-question-pro-survey-token-option';
import { EndDateGuard } from '../../request-handlers/guards/end-date-guard';
import { QuestionProSurveyParticipationGuard } from '../../request-handlers/guards/question-pro-survey-participation-guard';
import { RepeatRequestGuard } from '../../request-handlers/guards/repeat-request-guard';
import { RequestHandlerGuardExecutor } from '../../request-handlers/guards/request-handler-guard-executor';
import { StartDateGuard } from '../../request-handlers/guards/start-date-guard';
import { RequestHandler } from '../../request-handlers/request-handlers';

type EarnByQuestionProSurveyRequest = TokenATMRequest<EarnByQuestionProSurveyTokenOption>;

@Injectable()
export class EarnByQuestionProSurveyRequestHandler extends RequestHandler<
    EarnByQuestionProSurveyTokenOption,
    EarnByQuestionProSurveyRequest
> {
    constructor(@Inject(QuestionProService) private questionProService: QuestionProService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: EarnByQuestionProSurveyRequest
    ): Promise<ProcessedRequest> {
        const guardExecutor = new RequestHandlerGuardExecutor([
            new StartDateGuard(request.submittedTime, request.tokenOption.startTime),
            new EndDateGuard(request.submittedTime, request.tokenOption.endTime),
            new RepeatRequestGuard(request.tokenOption, studentRecord.processedRequests),
            new QuestionProSurveyParticipationGuard(
                request.tokenOption.surveyId,
                request.tokenOption.responseField,
                studentRecord.student.email,
                this.questionProService
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
        return 'earn-by-question-pro-survey';
    }
}
