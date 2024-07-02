import { Injectable } from '@angular/core';
import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import type { <%= classify(name) %>TokenOption } from './<%= dasherize(name) %>-token-option';
import { <%= classify(name) %>Request } from './<%= dasherize(name) %>-request';
import { RequestResolver } from 'app/token-options/request-resolver';

@Injectable()
export class <%= classify(name) %>RequestResolver extends RequestResolver<<%= classify(name) %>TokenOption, <%= classify(name) %>Request> {
    public async resolve(
        tokenOption: <%= classify(name) %>TokenOption,
        quizSubmissionDetail: QuizSubmissionDetail
    ): Promise<<%= classify(name) %>Request> {
        // TODO-Now: implement custom request resolution
        throw new Error('Custom resolution logic for <%= classify(name) %>Request is not implemented!');
        return new <%= classify(name) %>Request(
            tokenOption,
            quizSubmissionDetail.student,
            quizSubmissionDetail.submittedTime,
            quizSubmissionDetail
        );
    }
    public get type(): string {
        return '<%= dasherize(name) %>';
    }
}
