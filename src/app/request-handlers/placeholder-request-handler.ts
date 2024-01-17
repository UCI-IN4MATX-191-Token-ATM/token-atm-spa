import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { CanvasService } from 'app/services/canvas.service';
import { EndDateGuard } from './guards/end-date-guard';
import { RequestHandlerGuardExecutor } from './guards/request-handler-guard-executor';
import { StartDateGuard } from './guards/start-date-guard';
import { SufficientTokenBalanceGuard } from './guards/sufficient-token-balance-guard';
import { RequestHandler } from './request-handlers';
import { MultipleSectionEndDateGuard } from './guards/multiple-section-end-date-guard';
import type { PlaceholderTokenOption } from 'app/token-options/placeholder-token-option';
import type { PlaceholderRequest } from 'app/requests/placeholder-request';
import { MultipleSectionStartDateGuard } from './guards/multiple-section-start-date-guard';
import type { RequestHandlerGuard } from './guards/request-handler-guard';
import { MultipleRequestsGuard } from './guards/multiple-requests-guard';
import { ExcludeTokenOptionsGuard } from './guards/exclude-token-options-guard';

@Injectable()
export class PlaceholderRequestHandler extends RequestHandler<PlaceholderTokenOption, PlaceholderRequest> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: PlaceholderRequest
    ): Promise<ProcessedRequest> {
        const tokenOption = request.tokenOption;
        const guards: RequestHandlerGuard[] = [
            new MultipleRequestsGuard(tokenOption, studentRecord.processedRequests),
            new ExcludeTokenOptionsGuard(tokenOption.excludeTokenOptionIds, studentRecord.processedRequests)
        ];
        if (tokenOption.tokenBalanceChange < 0)
            guards.push(new SufficientTokenBalanceGuard(studentRecord.tokenBalance, tokenOption.tokenBalanceChange));
        if (tokenOption.startTime !== null)
            guards.push(
                tokenOption.startTime instanceof Date
                    ? new StartDateGuard(request.submittedTime, tokenOption.startTime)
                    : new MultipleSectionStartDateGuard(
                          configuration.course.id,
                          studentRecord.student.id,
                          request.submittedTime,
                          tokenOption.startTime,
                          this.canvasService
                      )
            );

        if (tokenOption.endTime !== null)
            guards.push(
                tokenOption.endTime instanceof Date
                    ? new EndDateGuard(request.submittedTime, tokenOption.endTime)
                    : new MultipleSectionEndDateGuard(
                          configuration.course.id,
                          studentRecord.student.id,
                          request.submittedTime,
                          tokenOption.endTime,
                          this.canvasService
                      )
            );

        const guardExecutor = new RequestHandlerGuardExecutor(guards);
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
            guardExecutor.message ?? '',
            request.tokenOption.group.id
        );
    }

    public get type(): string {
        return 'placeholder-token-option';
    }
}
