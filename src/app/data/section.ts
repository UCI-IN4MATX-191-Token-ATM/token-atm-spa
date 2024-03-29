export class Section {
    private _id: string;
    private _name: string;

    constructor(id: string, name: string) {
        this._id = id;
        this._name = name;
    }

    public get id(): string {
        return this._id;
    }

    public get name(): string {
        return this._name;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(data: any): Section {
        if (typeof data['id'] != 'string' || typeof data['name'] != 'string') throw new Error('Invalid data');
        return new Section(data['id'], data['name']);
    }
}
