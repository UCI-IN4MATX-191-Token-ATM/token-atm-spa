export class QuizSubmission {
    private _id: string;
    private _quizId: string;
    private _studentId: string;
    private _attempt: number;

    constructor(id: string, quizId: string, studentId: string, attempt: number) {
        this._id = id;
        this._quizId = quizId;
        this._studentId = studentId;
        this._attempt = attempt;
    }

    public get id(): string {
        return this._id;
    }

    public get quizId(): string {
        return this._quizId;
    }

    public get studentId(): string {
        return this._studentId;
    }

    public get attempt(): number {
        return this._attempt;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(data: any): QuizSubmission {
        if (
            typeof data['id'] != 'string' ||
            typeof data['quiz_id'] != 'string' ||
            typeof data['user_id'] != 'string' ||
            typeof data['attempt'] != 'number' ||
            typeof data['workflow_state'] != 'string'
        )
            throw new Error('Invalid data');
        return new QuizSubmission(
            data['id'],
            data['quiz_id'],
            data['user_id'],
            data['attempt'] - (data['workflow_state'] == 'untaken' ? 1 : 0)
        );
    }
}
