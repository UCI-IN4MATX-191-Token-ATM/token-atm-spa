import type { TokenOptionGroup } from '../data/token-option-group';

export abstract class TokenOption {
    private _group: TokenOptionGroup;
    private _type: string;
    private _id: number;
    private _name: string;
    private _tokenBalanceChange: number;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(group: TokenOptionGroup, data: any) {
        this._group = group;
        if (
            typeof data['type'] != 'string' ||
            typeof data['id'] != 'number' ||
            typeof data['name'] != 'string' ||
            typeof data['token_balance_change'] != 'number'
        )
            throw new Error('Invalid data');
        this._type = data['type'];
        this._id = data['id'];
        this._name = data['name'];
        this._tokenBalanceChange = data['token_balance_change'];
    }

    public get group(): TokenOptionGroup {
        return this._group;
    }

    public get type(): string {
        return this._type;
    }

    public get id(): number {
        return this._id;
    }

    public get name(): string {
        return this._name;
    }

    public get tokenBalanceChange(): number {
        return this._tokenBalanceChange;
    }

    public get prompt(): string {
        return 'Request for ' + this.name;
    }
}
