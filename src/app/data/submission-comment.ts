export class SubmissionComment {
    private _id: string;
    private _content: string;
    private _created_at: Date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(data: any) {
        if (
            typeof data['id'] != 'string' ||
            typeof data['comment'] != 'string' ||
            typeof data['created_at'] != 'string'
        )
            throw new Error('Invalid data');
        this._id = data['id'];
        this._content = data['comment'];
        this._created_at = new Date(data['created_at']);
    }

    public get id(): string {
        return this._id;
    }

    public get content(): string {
        return this._content;
    }

    public get created_at(): Date {
        return this._created_at;
    }
}
