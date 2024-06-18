import type { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import type { Student } from 'app/data/student';
import type { TokenOption } from 'app/token-options/token-option';

export abstract class TokenATMRequest<T extends TokenOption> {
    private _tokenOption: T;
    private _student: Student;
    private _submittedTime: Date;
    private _quizSubmissionDetail: QuizSubmissionDetail;

    constructor(tokenOption: T, student: Student, submittedTime: Date, quizSubmissionDetail: QuizSubmissionDetail) {
        this._tokenOption = tokenOption;
        this._student = student;
        this._submittedTime = submittedTime;
        this._quizSubmissionDetail = quizSubmissionDetail;
    }

    public get tokenOption(): T {
        return this._tokenOption;
    }

    public get type(): string {
        return this._tokenOption.type;
    }

    public get student(): Student {
        return this._student;
    }

    public get submittedTime(): Date {
        return this._submittedTime;
    }

    public get quizSubmissionDetail(): QuizSubmissionDetail {
        return this._quizSubmissionDetail;
    }
}

export class DefaultRequest<T extends TokenOption = TokenOption> extends TokenATMRequest<T> {}
