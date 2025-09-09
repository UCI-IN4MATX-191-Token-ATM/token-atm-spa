import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenATMRequest } from 'app/token-options/token-atm-request';
import type { SpendForAdditionalAssignmentTimeTokenOption } from './spend-for-additional-assignment-time-token-option';
import { RequestHandler } from 'app/token-options/request-handler';
import { RequestHandlerGuardExecutor } from '../request-handler-guards/request-handler-guard-executor';
import { MultipleRequestsGuard } from '../request-handler-guards/multiple-requests-guard';
import { ExcludeTokenOptionsGuard } from '../request-handler-guards/exclude-token-options-guard';
import { SufficientTokenBalanceGuard } from '../request-handler-guards/sufficient-token-balance-guard';
import { CanvasService } from 'app/services/canvas.service';

type SpendForAdditionalAssignmentTimeRequest = TokenATMRequest<SpendForAdditionalAssignmentTimeTokenOption>;

@Injectable()
export class SpendForAdditionalAssignmentTimeRequestHandler extends RequestHandler<
    SpendForAdditionalAssignmentTimeTokenOption,
    SpendForAdditionalAssignmentTimeRequest
> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: SpendForAdditionalAssignmentTimeRequest
    ): Promise<ProcessedRequest> {
        const guardExecutor = new RequestHandlerGuardExecutor([
            new MultipleRequestsGuard(request.tokenOption, studentRecord.processedRequests),
            new ExcludeTokenOptionsGuard(request.tokenOption.excludeTokenOptionIds, studentRecord.processedRequests),
            new SufficientTokenBalanceGuard(studentRecord.tokenBalance, request.tokenOption.tokenBalanceChange)
        ]);
        await guardExecutor.check();

        let isExtended = false;
        if (!guardExecutor.isRejected) {
            const { unlockAtChange, dueAtChange, lockAtChange, dateConflict } = request.tokenOption;
            isExtended = await this.canvasService.extendAssignmentForStudent(
                configuration.course.id,
                request.tokenOption.assignmentId,
                request.student.id,
                `Token ATM - ${configuration.uid}`,
                { unlockAtChange, dueAtChange, lockAtChange, dateConflict }
            );
        }

        const isApproved = !guardExecutor.isRejected && isExtended;
        return new ProcessedRequest(
            configuration,
            request.tokenOption.id,
            request.tokenOption.name,
            studentRecord.student,
            isApproved,
            request.submittedTime,
            new Date(),
            !isApproved ? 0 : request.tokenOption.tokenBalanceChange,
            guardExecutor.message ?? (isExtended ? '' : 'Existing Assignment dates won’t be changed by this request'),
            request.tokenOption.group.id
        );
    }

    public get type(): string {
        return 'spend-for-additional-assignment-time';
    }
}
