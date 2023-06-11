export class AssignmentOverride {
    private _id: string;
    private _title: string;
    private _studentIds: string[];

    constructor(id: string, title: string, studentIds: string[]) {
        this._id = id;
        this._title = title;
        this._studentIds = studentIds;
    }

    public get id(): string {
        return this._id;
    }

    public get title(): string {
        return this._title;
    }

    public get studentIds(): string[] {
        return this._studentIds;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(data: any): AssignmentOverride {
        if (
            typeof data['id'] != 'string' ||
            typeof data['title'] != 'string' ||
            typeof data['student_ids'] != 'object' ||
            !Array.isArray(data['student_ids'])
        )
            throw new Error('Invalid data');
        return new AssignmentOverride(data['id'], data['title'], data['student_ids']);
    }
}
