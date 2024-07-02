import { Injectable } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';<% if (!useCustomRequest) { %>
import type { DefaultRequest } from 'app/token-options/token-atm-request';<% } %>
import type { <%= classify(name) %>TokenOption } from './<%= dasherize(name) %>-token-option';<% if (useCustomRequest) { %>
import type { <%= classify(name) %>Request } from './<%= dasherize(name) %>-request';<% } %>
import { RequestHandler } from 'app/token-options/request-handler';<% if (!useCustomRequest) { %>

type <%= classify(name) %>Request = DefaultRequest<<%= classify(name) %>TokenOption>;<% } %>

@Injectable()
export class <%= classify(name) %>RequestHandler extends RequestHandler<<%= classify(name) %>TokenOption, <%= classify(name) %>Request> {
    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: <%= classify(name) %>Request
    ): Promise<ProcessedRequest> {
        // TODO-Now: implement request handling logic
        throw new Error('Custom handling logic for <%= classify(name) %>Request is not implemented!');
        return new ProcessedRequest(
            configuration,
            request.tokenOption.id,
            request.tokenOption.name,
            studentRecord.student,
            false, // TODO-Now: whether the request is approved
            request.submittedTime,
            new Date(), // when did the request get processed
            0, // TODO-Now: token balance change for student
            'Request handling logic for this type of token option has not been implemented yet!', // TODO-Now: description for the request processing result
            request.tokenOption.group.id
        );
    }

    public get type(): string {
        return '<%= dasherize(name) %>';
    }
}
