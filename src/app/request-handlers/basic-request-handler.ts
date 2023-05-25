import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { BasicRequest } from 'app/requests/basic-request';
import { CanvasService } from 'app/services/canvas.service';
import type { BasicTokenOption } from 'app/token-options/basic-token-option';
import { getUnixTime } from 'date-fns';
import { RequestHandler } from './request-handlers';

@Injectable()
export class BasicRequestHandler extends RequestHandler<BasicTokenOption, BasicRequest> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }

    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: BasicRequest
    ): Promise<ProcessedRequest> {
        console.log('Basic request processed', this.canvasService);
        return new ProcessedRequest(configuration, studentRecord.student, {
            token_option_id: request.tokenOption.id,
            token_option_name: request.tokenOption.name,
            token_option_group_id: request.tokenOption.group.id,
            is_approved: true,
            submit_time: getUnixTime(request.submittedTime),
            process_time: getUnixTime(new Date()),
            message: 'This basic request is approved.',
            token_balance_change: request.tokenOption.tokenBalanceChange
        });
    }

    public get type(): string {
        return 'basic';
    }
}
