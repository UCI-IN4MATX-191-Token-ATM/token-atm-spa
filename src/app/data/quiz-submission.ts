export class QuizSubmission {
    private _id: string;
    private _quizId: string;
    private _studentId: string;
    private _attempt: number;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(data: any) {
        if (
            typeof data['id'] != 'string' ||
            typeof data['quiz_id'] != 'string' ||
            typeof data['user_id'] != 'string' ||
            typeof data['attempt'] != 'number' ||
            typeof data['workflow_state'] != 'string'
        )
            throw new Error('Invalid data');
        this._id = data['id'];
        this._quizId = data['quiz_id'];
        this._studentId = data['user_id'];
        this._attempt = data['attempt'];
        if (data['workflow_state'] == 'untaken') this._attempt--;
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
}
