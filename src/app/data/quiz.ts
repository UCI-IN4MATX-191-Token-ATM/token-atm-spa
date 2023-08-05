export class Quiz {
    private _id: string;
    private _title: string;
    private _assignmentId: string;
    private _pointsPossible: number;

    constructor(id: string, title: string, assignmentId: string, pointsPossible: number) {
        this._id = id;
        this._title = title;
        this._assignmentId = assignmentId;
        this._pointsPossible = pointsPossible;
    }

    public get id(): string {
        return this._id;
    }

    public get title(): string {
        return this._title;
    }

    public get assignmentId(): string {
        return this._assignmentId;
    }

    public get pointsPossible(): number {
        return this._pointsPossible;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(data: any): Quiz {
        if (
            typeof data['id'] != 'string' ||
            typeof data['title'] != 'string' ||
            typeof data['assignment_id'] != 'string' ||
            (typeof data['points_possible'] != 'number' && data['points_possible'] != null)
        )
            throw new Error('Invalid data');
        return new Quiz(data['id'], data['title'], data['assignment_id'], data['points_possible'] ?? 0);
    }
}
