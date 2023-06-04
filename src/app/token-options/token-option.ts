import { Base64 } from 'js-base64';
import type { TokenOptionGroup } from '../data/token-option-group';

export abstract class TokenOption {
    private _group: TokenOptionGroup;
    private _type: string;
    private _id: number;
    private _name: string;
    private _description: string;
    private _tokenBalanceChange: number;

    constructor(
        group: TokenOptionGroup,
        type: string,
        id: number,
        name: string,
        description: string,
        tokenBalanceChange: number
    ) {
        this._group = group;
        this._type = type;
        this._id = id;
        this._name = name;
        this._description = description;
        this._tokenBalanceChange = tokenBalanceChange;
    }

    public get group(): TokenOptionGroup {
        return this._group;
    }

    protected set group(group: TokenOptionGroup) {
        this._group = group;
    }

    public get type(): string {
        return this._type;
    }

    protected set type(type: string) {
        this._type = type;
    }

    public get id(): number {
        return this._id;
    }

    protected set id(id: number) {
        this._id = id;
    }

    public get name(): string {
        return this._name;
    }

    public set name(name: string) {
        this._name = name;
    }

    public get description(): string {
        return this._description;
    }

    public set description(description: string) {
        this._description = description;
    }

    public get tokenBalanceChange(): number {
        return this._tokenBalanceChange;
    }

    public set tokenBalanceChange(tokenBalanceChange: number) {
        this._tokenBalanceChange = tokenBalanceChange;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected static resolveTokenOption(
        group: TokenOptionGroup,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any
    ): ConstructorParameters<typeof TokenOption> {
        if (
            typeof data['type'] != 'string' ||
            typeof data['id'] != 'number' ||
            typeof data['name'] != 'string' ||
            (typeof data['description'] != 'undefined' && typeof data['description'] != 'string') ||
            typeof data['token_balance_change'] != 'number'
        )
            throw new Error('Invalid data');
        return [
            group,
            data['type'],
            data['id'],
            data['name'],
            data['description'] ? Base64.decode(data['description']) : '',
            data['token_balance_change']
        ];
    }
}
