export class SubmissionComment {
    private _id: string;
    private _content: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(data: any) {
        if (typeof data['id'] != 'string' || typeof data['comment'] != 'string') throw new Error('Invalid data');
        this._id = data['id'];
        this._content = data['comment'];
    }

    public get id(): string {
        return this._id;
    }

    public get content(): string {
        return this._content;
    }
}
