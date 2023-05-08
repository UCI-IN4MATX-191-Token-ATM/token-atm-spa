import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { BasicRequest } from 'app/requests/basic-request';
import { CanvasService } from 'app/services/canvas.service';
import type { BasicTokenOption } from 'app/token-options/basic-token-option';
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
            is_approved: true,
            message: 'This basic request is approved.'
        });
    }
    public get type(): string {
        return 'basic';
    }
}