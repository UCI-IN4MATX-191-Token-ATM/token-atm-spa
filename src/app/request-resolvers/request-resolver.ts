import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import type { TokenATMRequest } from 'app/requests/token-atm-request';
import type { TokenOption } from 'app/token-options/token-option';

export abstract class RequestResolver<T extends TokenOption, R extends TokenATMRequest<T>> {
    public abstract resolve(tokenOption: T, quizSubmissionDetail: QuizSubmissionDetail): Promise<R>;
    public abstract get type(): string;
}
