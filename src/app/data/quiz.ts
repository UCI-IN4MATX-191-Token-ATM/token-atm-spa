export class Quiz {
    private _id: string;
    private _assignmentId: string;
    private _pointsPossible: number;

    constructor(id: string, assignmentId: string, pointsPossible: number) {
        this._id = id;
        this._assignmentId = assignmentId;
        this._pointsPossible = pointsPossible;
    }

    public get id(): string {
        return this._id;
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
            typeof data['assignment_id'] != 'string' ||
            typeof data['points_possible'] != 'number'
        )
            throw new Error('Invalid data');
        return new Quiz(data['id'], data['assignment_id'], data['points_possible']);
    }
}
