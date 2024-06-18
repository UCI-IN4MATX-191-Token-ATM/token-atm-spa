import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenATMRequest } from 'app/token-options/token-atm-request';
import { CanvasService } from 'app/services/canvas.service';
import type { SpendForLabDataTokenOption } from 'app/token-options/spend-for-lab-data/spend-for-lab-data-token-option';
import { EndDateGuard } from '../request-handler-guards/end-date-guard';
import { ExcludeTokenOptionsGuard } from '../request-handler-guards/exclude-token-options-guard';
import { RepeatRequestGuard } from '../request-handler-guards/repeat-request-guard';
import { RequestHandlerGuardExecutor } from '../request-handler-guards/request-handler-guard-executor';
import { StartDateGuard } from '../request-handler-guards/start-date-guard';
import { SufficientTokenBalanceGuard } from '../request-handler-guards/sufficient-token-balance-guard';
import { RequestHandler } from '../request-handlers';

type SpendForLabDataRequest = TokenATMRequest<SpendForLabDataTokenOption>;

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
        if (!guardExecutor.isRejected) {
            const assignmentId = await this.canvasService.getAssignmentIdByQuizId(
                configuration.course.id,
                request.tokenOption.quizId
            );
            await this.canvasService.createAssignmentOverrideForStudent(
                configuration.course.id,
                assignmentId,
                request.student.id,
                `Token ATM - ${configuration.uid}`,
                request.tokenOption.newDueTime
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
        return 'spend-for-lab-data';
    }
}
