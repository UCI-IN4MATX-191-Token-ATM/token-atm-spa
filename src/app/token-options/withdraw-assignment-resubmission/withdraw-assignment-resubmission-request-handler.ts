import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { CanvasService } from 'app/services/canvas.service';
import type { WithdrawAssignmentResubmissionTokenOption } from 'app/token-options/withdraw-assignment-resubmission/withdraw-assignment-resubmission-token-option';
import { EndDateGuard } from '../../request-handlers/guards/end-date-guard';
import { HasApprovedRequestGuard } from '../../request-handlers/guards/has-approved-request-guard';
import { NoAssignmentSubmissionGuard } from '../../request-handlers/guards/no-assignment-submission-guard';
import { RequestHandlerGuardExecutor } from '../../request-handlers/guards/request-handler-guard-executor';
import { StartDateGuard } from '../../request-handlers/guards/start-date-guard';
import { RequestHandler } from '../../request-handlers/request-handlers';
import { MultipleSectionEndDateGuard } from '../../request-handlers/guards/multiple-section-end-date-guard';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';
import type { TokenATMRequest } from 'app/requests/token-atm-request';

type WithdrawAssignmentResubmissionRequest = TokenATMRequest<WithdrawAssignmentResubmissionTokenOption>;

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
            const newDueTime = withdrawTokenOption.newDueTime;
            const guardExecutor = new RequestHandlerGuardExecutor([
                new StartDateGuard(request.submittedTime, withdrawTokenOption.startTime),
                withdrawTokenOption.endTime instanceof Date
                    ? new EndDateGuard(request.submittedTime, withdrawTokenOption.endTime)
                    : new MultipleSectionEndDateGuard(
                          configuration.course.id,
                          studentRecord.student.id,
                          request.submittedTime,
                          withdrawTokenOption.endTime,
                          this.canvasService
                      ),
                new HasApprovedRequestGuard(withdrawTokenOption, studentRecord.processedRequests),
                new NoAssignmentSubmissionGuard(
                    configuration.course.id,
                    withdrawTokenOption.assignmentId,
                    studentRecord.student.id,
                    `Token ATM - ${configuration.uid}`,
                    newDueTime instanceof Date
                        ? newDueTime
                        : newDueTime.match(
                              await DataConversionHelper.convertAsyncIterableToList(
                                  await this.canvasService.getStudentSectionEnrollments(
                                      configuration.course.id,
                                      studentRecord.student.id
                                  )
                              )
                          ),
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
