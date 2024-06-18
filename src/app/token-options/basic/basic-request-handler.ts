import { Inject, Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { DefaultRequest } from 'app/token-options/token-atm-request';
import { CanvasService } from 'app/services/canvas.service';
import type { BasicTokenOption } from 'app/token-options/basic/basic-token-option';
import { RequestHandler } from '../request-handlers';

type BasicRequest = DefaultRequest<BasicTokenOption>;

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
        return new ProcessedRequest(
            configuration,
            request.tokenOption.id,
            request.tokenOption.name,
            studentRecord.student,
            true,
            request.submittedTime,
            new Date(),
            request.tokenOption.tokenBalanceChange,
            'This basic request is approved.',
            request.tokenOption.group.id
        );
    }

    public get type(): string {
        return 'basic';
    }
}
