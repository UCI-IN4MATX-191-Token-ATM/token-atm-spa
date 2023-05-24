export class Student {
    private _id: string;
    private _name: string;
    private _email?: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(data: any) {
        if (
            typeof data['id'] != 'string' ||
            typeof data['name'] != 'string' ||
            (typeof data['email'] != 'undefined' && typeof data['email'] != 'string')
        )
            throw new Error('Invalid data');
        this._id = data['id'];
        this._name = data['name'];
        this._email = data['email'];
    }

    public get id(): string {
        return this._id;
    }
    public get name(): string {
        return this._name;
    }
    public get email(): string {
        return this._email ?? '';
    }
}
