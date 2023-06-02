export class SubmissionComment {
    private _id: string;
    private _content: string;
    private _createdAt: Date;

    constructor(id: string, content: string, createdAt: Date) {
        this._id = id;
        this._content = content;
        this._createdAt = createdAt;
    }

    public get id(): string {
        return this._id;
    }

    public get content(): string {
        return this._content;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(data: any): SubmissionComment {
        if (
            typeof data['id'] != 'string' ||
            typeof data['comment'] != 'string' ||
            typeof data['created_at'] != 'string'
        )
            throw new Error('Invalid data');
        return new SubmissionComment(data['id'], data['comment'], new Date(data['created_at']));
    }
}
