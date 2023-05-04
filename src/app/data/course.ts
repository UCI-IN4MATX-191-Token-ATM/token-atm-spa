export class Course {
    private _id: string;
    private _name: string;
    private _term: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(data: any) {
        if (
            typeof data['id'] != 'string' ||
            typeof data['name'] != 'string' ||
            typeof data['term']?.['name'] != 'string'
        )
            throw new Error('Invalid data');
        this._id = data['id'];
        this._name = data['name'];
        this._term = data['term']['name'];
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
}
