export class User {
    private _id: string;
    private _name: string;
    private _email?: string;
    private _avatarURL?: string;

    constructor(id: string, name: string, email?: string, avatarURL?: string) {
        this._id = id;
        this._name = name;
        this._email = email;
        this._avatarURL = avatarURL;
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

    public get avatarURL(): string {
        return this._avatarURL ?? '';
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(data: any): User {
        if (
            typeof data['id'] != 'string' ||
            typeof data['name'] != 'string' ||
            (typeof data['email'] != 'undefined' && typeof data['email'] != 'string') ||
            (typeof data['avatar_url'] != 'undefined' && typeof data['avatar_url'] != 'string')
        )
            throw new Error('Invalid data');
        return new User(data['id'], data['name'], data['email'], data['avatar_url']);
    }
}
