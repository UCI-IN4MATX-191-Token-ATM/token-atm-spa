import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import { DefaultRequest, type TokenATMRequest } from 'app/token-options/token-atm-request';
import type { TokenOption } from 'app/token-options/token-option';

export abstract class RequestResolver<T extends TokenOption, R extends TokenATMRequest<T>> {
    public abstract resolve(tokenOption: T, quizSubmissionDetail: QuizSubmissionDetail): Promise<R>;
    public abstract get type(): string;
}

export function constructDefaultResolver<T extends TokenOption = TokenOption>(type: string) {
    return class extends RequestResolver<T, TokenATMRequest<T>> {
        public async resolve(tokenOption: T, quizSubmissionDetail: QuizSubmissionDetail): Promise<TokenATMRequest<T>> {
            return new DefaultRequest(
                tokenOption,
                quizSubmissionDetail.student,
                quizSubmissionDetail.submittedTime,
                quizSubmissionDetail
            );
        }
        public get type(): string {
            return type;
        }
    };
}
