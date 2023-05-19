import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { EarnByModuleRequest } from 'app/requests/earn-by-module-request';
import { CanvasService } from 'app/services/canvas.service';
import type { EarnByModuleTokenOption } from 'app/token-options/earn-by-module-token-option';
import { getUnixTime } from 'date-fns';
import { ModuleGradeThresholdGuard } from './guards/module-grade-threshold-guard';
import { RepeatRequestGuard } from './guards/repeat-request-guard';
import { RequestHandlerGuardExecutor } from './guards/request-handler-guard-executor';
import { StartDateGuard } from './guards/start-date-guard';
import { RequestHandler } from './request-handlers';

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
            new ModuleGradeThresholdGuard(
                configuration.course.id,
                request.tokenOption.moduleId,
                studentRecord.student.id,
                request.tokenOption.gradeThreshold,
                this.canvasService
            ),
            new RepeatRequestGuard(request.tokenOption, studentRecord.processedRequests)
        ]);
        await guardExecutor.check();
        return new ProcessedRequest(configuration, request.student, {
            token_option_id: request.tokenOption.id,
            token_option_name: request.tokenOption.name,
            is_approved: !guardExecutor.isRejected,
            submit_time: getUnixTime(request.submittedTime),
            process_time: getUnixTime(new Date()),
            message: guardExecutor.message
        });
    }
    public get type(): string {
        return 'earn-by-module';
    }
}
