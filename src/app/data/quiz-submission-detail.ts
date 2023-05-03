import type { Student } from './student';

export class QuizSubmissionDetail {
    private _student: Student;
    private _submittedTime: Date;
    private _curAttempt: number;
    private _answers: string[];

    constructor(student: Student, submittedTime: Date, curAttempt: number, answers: string[]) {
        this._student = student;
        this._submittedTime = submittedTime;
        this._curAttempt = curAttempt;
        this._answers = answers.slice(0);
    }

    public get student(): Student {
        return this._student;
    }

    public get curAttempt(): number {
        return this._curAttempt;
    }

    public get submittedTime(): Date {
        return this._submittedTime;
    }

    public get answers(): string[] {
        return this._answers;
    }
}
