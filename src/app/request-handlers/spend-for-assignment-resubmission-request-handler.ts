import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { SpendForAssignmentResubmissionRequest } from 'app/requests/spend-for-assignment-resubmission-request';
import { CanvasService } from 'app/services/canvas.service';
import type { SpendForAssignmentResubmissionTokenOption } from 'app/token-options/spend-for-assignment-resubmission-token-option';
import { EndDateGuard } from './guards/end-date-guard';
import { RepeatRequestGuard } from './guards/repeat-request-guard';
import { RequestHandlerGuardExecutor } from './guards/request-handler-guard-executor';
import { StartDateGuard } from './guards/start-date-guard';
import { SufficientTokenBalanceGuard } from './guards/sufficient-token-balance-guard';
import { RequestHandler } from './request-handlers';
import { MultipleSectionEndDateGuard } from './guards/multiple-section-end-date-guard';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';

@Injectable()
export class SpendForAssignmentResubmissionRequestHandler extends RequestHandler<
    SpendForAssignmentResubmissionTokenOption,
    SpendForAssignmentResubmissionRequest
> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: SpendForAssignmentResubmissionRequest
    ): Promise<ProcessedRequest> {
        const guardExecutor = new RequestHandlerGuardExecutor([
            new StartDateGuard(request.submittedTime, request.tokenOption.startTime),
            request.tokenOption.endTime instanceof Date
                ? new EndDateGuard(request.submittedTime, request.tokenOption.endTime)
                : new MultipleSectionEndDateGuard(
                      configuration.course.id,
                      studentRecord.student.id,
                      request.submittedTime,
                      request.tokenOption.endTime,
                      this.canvasService
                  ),
            new RepeatRequestGuard(request.tokenOption, studentRecord.processedRequests),
            new SufficientTokenBalanceGuard(studentRecord.tokenBalance, request.tokenOption.tokenBalanceChange)
        ]);
        await guardExecutor.check();
        const newDueTime = request.tokenOption.newDueTime;
        if (!guardExecutor.isRejected) {
            await this.canvasService.createAssignmentOverrideForStudent(
                configuration.course.id,
                request.tokenOption.assignmentId,
                request.student.id,
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
                      )
            );
        }
        return new ProcessedRequest(
            configuration,
            request.tokenOption.id,
            request.tokenOption.name,
            request.student,
            !guardExecutor.isRejected,
            request.submittedTime,
            new Date(),
            guardExecutor.isRejected ? 0 : request.tokenOption.tokenBalanceChange,
            guardExecutor.message ?? '',
            request.tokenOption.group.id
        );
    }

    public get type(): string {
        return 'spend-for-assignment-resubmission';
    }
}
