export class User {
    private _id: string;
    private _name: string;
    private _email?: string;
    private _avatar_url?: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(data: any) {
        if (
            typeof data['id'] != 'string' ||
            typeof data['name'] != 'string' ||
            (typeof data['email'] != 'undefined' && data['email'] != 'string') ||
            (typeof data['_avatar_url'] != 'undefined' && data['_avatar_url'] != 'string')
        )
            throw new Error('Invalid data');
        this._id = data['id'];
        this._name = data['name'];
        this._email = data['email'];
        this._avatar_url = data['email'];
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
    public get avatar_url(): string {
        return this._avatar_url ?? '';
    }
}
