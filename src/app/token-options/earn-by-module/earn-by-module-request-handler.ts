import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenATMRequest } from 'app/token-options/token-atm-request';
import { CanvasService } from 'app/services/canvas.service';
import type { EarnByModuleTokenOption } from 'app/token-options/earn-by-module/earn-by-module-token-option';
import { ModuleGradeThresholdGuard } from '../request-handler-guards/module-grade-threshold-guard';
import { RepeatRequestGuard } from '../request-handler-guards/repeat-request-guard';
import { RequestHandlerGuardExecutor } from '../request-handler-guards/request-handler-guard-executor';
import { StartDateGuard } from '../request-handler-guards/start-date-guard';
import { RequestHandler } from '../request-handlers';

type EarnByModuleRequest = TokenATMRequest<EarnByModuleTokenOption>;

@Injectable()
export class EarnByModuleRequestHandler extends RequestHandler<EarnByModuleTokenOption, EarnByModuleRequest> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: EarnByModuleRequest
    ): Promise<ProcessedRequest> {
        const guardExecutor = new RequestHandlerGuardExecutor([
            new StartDateGuard(request.submittedTime, request.tokenOption.startTime),
            new RepeatRequestGuard(request.tokenOption, studentRecord.processedRequests),
            new ModuleGradeThresholdGuard(
                configuration.course.id,
                request.tokenOption.moduleId,
                studentRecord.student.id,
                request.tokenOption.gradeThreshold,
                this.canvasService
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
        return 'earn-by-module';
    }
}
