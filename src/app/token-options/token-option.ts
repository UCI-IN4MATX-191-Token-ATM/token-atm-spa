import { Base64 } from 'js-base64';
import type { TokenOptionGroup } from '../data/token-option-group';

export abstract class TokenOption {
    private _group: TokenOptionGroup;
    private _type: string;
    private _id: number;
    private _name: string;
    private _description: string;
    private _tokenBalanceChange: number;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(group: TokenOptionGroup, data: any) {
        this._group = group;
        if (
            typeof data['type'] != 'string' ||
            typeof data['id'] != 'number' ||
            typeof data['name'] != 'string' ||
            (typeof data['description'] != 'undefined' && typeof data['description'] != 'string') ||
            typeof data['token_balance_change'] != 'number'
        )
            throw new Error('Invalid data');
        this._type = data['type'];
        this._id = data['id'];
        this._name = data['name'];
        this._description = data['description'] ? Base64.decode(data['description']) : '';
        this._tokenBalanceChange = data['token_balance_change'];
    }

    public get group(): TokenOptionGroup {
        return this._group;
    }

    public get type(): string {
        return this._type;
    }

    public abstract get descriptiveName(): string;

    public get id(): number {
        return this._id;
    }

    public get name(): string {
        return this._name;
    }

    public get description(): string {
        return this._description;
    }

    public get tokenBalanceChange(): number {
        return this._tokenBalanceChange;
    }

    public get prompt(): string {
        return 'Request for ' + this.name;
    }

    public toJSON(): object {
        return {
            type: this.type,
            id: this.id,
            name: this.name,
            description: Base64.encode(this.description),
            token_balance_change: this.tokenBalanceChange
        };
    }
}
