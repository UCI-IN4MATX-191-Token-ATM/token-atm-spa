import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenATMRequest } from 'app/requests/token-atm-request';
import { CanvasService } from 'app/services/canvas.service';
import type { WithdrawLabDataTokenOption } from 'app/token-options/withdraw-lab-data/withdraw-lab-data-token-option';
import { EndDateGuard } from '../../request-handlers/guards/end-date-guard';
import { HasApprovedRequestGuard } from '../../request-handlers/guards/has-approved-request-guard';
import { NoQuizSubmissionGuard } from '../../request-handlers/guards/no-quiz-submission-guard';
import { RequestHandlerGuardExecutor } from '../../request-handlers/guards/request-handler-guard-executor';
import { StartDateGuard } from '../../request-handlers/guards/start-date-guard';
import { RequestHandler } from '../../request-handlers/request-handlers';

type WithdrawLabDataRequest = TokenATMRequest<WithdrawLabDataTokenOption>;

@Injectable()
export class WithdrawLabDataRequestHandler extends RequestHandler<WithdrawLabDataTokenOption, WithdrawLabDataRequest> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: WithdrawLabDataRequest
    ): Promise<ProcessedRequest> {
        let message = '';
        let isRejected = false;
        const withdrawTokenOption = request.tokenOption.withdrawTokenOption;
        if (!withdrawTokenOption) {
            message = 'The withdraw token option you requested is no longer valid.';
            isRejected = true;
        } else {
            const guardExecutor = new RequestHandlerGuardExecutor([
                new StartDateGuard(request.submittedTime, withdrawTokenOption.startTime),
                new EndDateGuard(request.submittedTime, withdrawTokenOption.endTime),
                new HasApprovedRequestGuard(withdrawTokenOption, studentRecord.processedRequests),
                new NoQuizSubmissionGuard(
                    configuration.course.id,
                    withdrawTokenOption.quizId,
                    studentRecord.student.id,
                    `Token ATM - ${configuration.uid}`,
                    withdrawTokenOption.newDueTime,
                    this.canvasService
                )
            ]);
            await guardExecutor.check();
            message = guardExecutor.message ?? '';
            isRejected = guardExecutor.isRejected;
        }
        return new ProcessedRequest(
            configuration,
            request.tokenOption.id,
            request.tokenOption.name,
            request.student,
            !isRejected,
            request.submittedTime,
            new Date(),
            isRejected ? 0 : request.tokenOption.tokenBalanceChange,
            message,
            request.tokenOption.group.id
        );
    }

    public get type(): string {
        return 'withdraw-lab-data';
    }
}
