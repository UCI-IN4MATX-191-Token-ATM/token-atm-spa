export class Course {
    private _id: string;
    private _name: string;
    private _term: string;

    constructor(id: string, name: string, term: string) {
        this._id = id;
        this._name = name;
        this._term = term;
    }

    public get id() {
        return this._id;
    }

    public get name() {
        return this._name;
    }

    public get term() {
        return this._term;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(data: any) {
        if (
            typeof data['id'] != 'string' ||
            typeof data['name'] != 'string' ||
            typeof data['term']?.['name'] != 'string'
        )
            throw new Error('Invalid data');
        return new Course(data['id'], data['name'], data['term']['name']);
    }
}
