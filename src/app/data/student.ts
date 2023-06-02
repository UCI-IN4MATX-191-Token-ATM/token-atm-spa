export class Student {
    private _id: string;
    private _name: string;
    private _email?: string;

    constructor(id: string, name: string, email?: string) {
        this._id = id;
        this._name = name;
        this._email = email;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(data: any): Student {
        if (
            typeof data['id'] != 'string' ||
            typeof data['name'] != 'string' ||
            (typeof data['email'] != 'undefined' && typeof data['email'] != 'string')
        )
            throw new Error('Invalid data');
        return new Student(data['id'], data['name'], data['email']);
    }
}
