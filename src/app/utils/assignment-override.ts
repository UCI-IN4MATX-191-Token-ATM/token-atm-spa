import { parseISO } from 'date-fns';

export class AssignmentOverride {
    private _id: string;
    private _title: string;
    private _studentIds: string[];
    private _lockAt?: Date;

    constructor(id: string, title: string, studentIds: string[], lockAt?: Date) {
        this._id = id;
        this._title = title;
        this._studentIds = studentIds;
        this._lockAt = lockAt;
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

    public get lockAt(): Date | undefined {
        return this._lockAt;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(data: any): AssignmentOverride {
        if (
            typeof data['id'] != 'string' ||
            typeof data['title'] != 'string' ||
            typeof data['student_ids'] != 'object' ||
            (typeof data['lock_at'] != 'undefined' && typeof data['lock_at'] != 'string') ||
            !Array.isArray(data['student_ids'])
        )
            throw new Error('Invalid data');
        return new AssignmentOverride(
            data['id'],
            data['title'],
            data['student_ids'],
            data['lock_at'] ? parseISO(data['lock_at']) : undefined
        );
    }
}
