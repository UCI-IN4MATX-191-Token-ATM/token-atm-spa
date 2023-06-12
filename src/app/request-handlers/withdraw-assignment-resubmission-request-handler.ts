import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { WithdrawAssignmentResubmissionRequest } from 'app/requests/withdraw-assignment-resubmission-request';
import { CanvasService } from 'app/services/canvas.service';
import type { WithdrawAssignmentResubmissionTokenOption } from 'app/token-options/withdraw-assignment-resubmission-token-option';
import { EndDateGuard } from './guards/end-date-guard';
import { HasApprovedRequestGuard } from './guards/has-approved-request-guard';
import { NoAssignmentSubmissionGuard } from './guards/no-assignment-submission-guard';
import { RequestHandlerGuardExecutor } from './guards/request-handler-guard-executor';
import { StartDateGuard } from './guards/start-date-guard';
import { RequestHandler } from './request-handlers';

@Injectable()
export class WithdrawAssignmentResubmissionRequestHandler extends RequestHandler<
    WithdrawAssignmentResubmissionTokenOption,
    WithdrawAssignmentResubmissionRequest
> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: WithdrawAssignmentResubmissionRequest
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
                new NoAssignmentSubmissionGuard(
                    configuration.course.id,
                    withdrawTokenOption.assignmentId,
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
        return 'withdraw-assignment-resubmission';
    }
}
