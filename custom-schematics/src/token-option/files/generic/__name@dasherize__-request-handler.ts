import { Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';<% if (!useCustomRequest) { %>
import type { DefaultRequest } from 'app/token-options/token-atm-request';<% } %>
import type { <%= classify(name) %>TokenOption } from './<%= dasherize(name) %>-token-option';<% if (useCustomRequest) { %>
import type { <%= classify(name) %>Request } from './<%= dasherize(name) %>-request';<% } %>
import { RequestHandler } from 'app/token-options/request-handlers';<% if (!useCustomRequest) { %>

type <%= classify(name) %>Request = DefaultRequest<<%= classify(name) %>TokenOption>;<% } %>

@Injectable()
export class <%= classify(name) %>RequestHandler extends RequestHandler<<%= classify(name) %>TokenOption, <%= classify(name) %>Request> {
    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: <%= classify(name) %>Request
    ): Promise<ProcessedRequest> {
        // TODO-Now: implement request handling logic
        return new ProcessedRequest(
            configuration,
            request.tokenOption.id,
            request.tokenOption.name,
            studentRecord.student,
            false, // TODO-Now
            request.submittedTime,
            new Date(),
            0, // TODO-Now
            'Request handling logic for this type of token option has not been implemented yet!', // TODO-Now
            request.tokenOption.group.id
        );
    }

    public get type(): string {
        return '<%= dasherize(name) %>';
    }
}
