import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { SpendForLabDataRequest } from 'app/requests/spend-for-lab-data-request';
import { CanvasService } from 'app/services/canvas.service';
import type { SpendForLabDataTokenOption } from 'app/token-options/spend-for-lab-data-token-option';
import { EndDateGuard } from './guards/end-date-guard';
import { ExcludeTokenOptionsGuard } from './guards/exclude-token-options-guard';
import { RepeatRequestGuard } from './guards/repeat-request-guard';
import { RequestHandlerGuardExecutor } from './guards/request-handler-guard-executor';
import { StartDateGuard } from './guards/start-date-guard';
import { SufficientTokenBalanceGuard } from './guards/sufficient-token-balance-guard';
import { RequestHandler } from './request-handlers';

@Injectable()
export class SpendForLabDataRequestHandler extends RequestHandler<SpendForLabDataTokenOption, SpendForLabDataRequest> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: SpendForLabDataRequest
    ): Promise<ProcessedRequest> {
        const guardExecutor = new RequestHandlerGuardExecutor([
            new StartDateGuard(request.submittedTime, request.tokenOption.startTime),
            new EndDateGuard(request.submittedTime, request.tokenOption.endTime),
            new RepeatRequestGuard(request.tokenOption, studentRecord.processedRequests),
            new ExcludeTokenOptionsGuard(request.tokenOption.excludeTokenOptionIds, studentRecord.processedRequests),
            new SufficientTokenBalanceGuard(studentRecord.tokenBalance, request.tokenOption.tokenBalanceChange)
        ]);
        await guardExecutor.check();
        let message = guardExecutor.message ?? '';
        let isRejected = guardExecutor.isRejected;
        if (!guardExecutor.isRejected) {
            const assignmentId = await this.canvasService.getAssignmentIdByQuizId(
                configuration.course.id,
                request.tokenOption.quizId
            );
            const override = await this.canvasService.getAssignmentOverrideByTitle(
                configuration.course.id,
                assignmentId,
                `Token ATM - ${configuration.uid}`
            );
            if (!override) {
                await this.canvasService.createAssignmentOverride(
                    configuration.course.id,
                    assignmentId,
                    `Token ATM - ${configuration.uid}`,
                    [request.student.id],
                    request.tokenOption.newDueTime
                );
            } else {
                if (override.studentIds.includes(request.student.id)) {
                    message =
                        'There is already an assignment override on this quiz for this student. It could be caused by a network error when processing this request. Your teacher should already have this issue handled by manually adjusting your token balance. Please check your request history.';
                    isRejected = true;
                } else
                    await this.canvasService.updateAssignmentOverride(
                        configuration.course.id,
                        assignmentId,
                        override.id,
                        `Token ATM - ${configuration.uid}`,
                        override.studentIds.concat(request.student.id),
                        request.tokenOption.newDueTime
                    );
                // TODO: failure to add means leftover?
                // TODO: stress testing is needed
            }
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
        return 'spend-for-lab-data';
    }
}
