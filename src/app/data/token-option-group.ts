import type { TokenATMConfiguration } from './token-atm-configuration';
import type { TokenOption } from '../token-options/token-option';
import { Base64 } from 'js-base64';
import decamelizeKeys from 'decamelize-keys';

export class TokenOptionGroup {
    private _configuration: TokenATMConfiguration;
    private _name: string;
    private _id: number;
    private _quizId: string;
    private _description: string;
    private _isPublished: boolean;
    private _tokenOptions: TokenOption[];

    constructor(
        configuration: TokenATMConfiguration,
        name: string,
        id: number,
        quizId: string,
        description: string,
        isPublished: boolean,
        tokenOptions: TokenOption[]
    ) {
        this._configuration = configuration;
        this._name = name;
        this._id = id;
        this._quizId = quizId;
        this._description = description;
        this._isPublished = isPublished;
        this._tokenOptions = tokenOptions;
    }

    public get configuration(): TokenATMConfiguration {
        return this._configuration;
    }

    public get name(): string {
        return this._name;
    }

    public set name(name: string) {
        this._name = name;
    }

    public get id(): number {
        return this._id;
    }

    public get quizId(): string {
        return this._quizId;
    }

    public set quizId(quizId: string) {
        this._quizId = quizId;
    }

    public get description(): string {
        return this._description;
    }

    public set description(description: string) {
        this._description = description;
    }

    public get isPublished(): boolean {
        return this._isPublished;
    }

    public set isPublished(isPublished: boolean) {
        this._isPublished = isPublished;
    }

    public get tokenOptions(): TokenOption[] {
        return this._tokenOptions;
    }

    protected set tokenOptions(tokenOptions: TokenOption[]) {
        this._tokenOptions = tokenOptions;
    }

    public get availableTokenOptions(): TokenOption[] {
        return this.tokenOptions.filter((tokenOption) => !tokenOption.isMigrating);
    }

    public addTokenOption(tokenOption: TokenOption, position?: number): void {
        this.configuration.updateNextFreeTokenOptionId(tokenOption.id);
        if (position == undefined) this._tokenOptions.push(tokenOption);
        else this._tokenOptions.splice(position, 0, tokenOption);
    }

    public deleteTokenOption(tokenOption: TokenOption): void {
        const index = this._tokenOptions.indexOf(tokenOption);
        if (index == -1) throw new Error('Token option does not exist');
        this._tokenOptions.splice(index, 1);
    }

    public toJSON(): object {
        return {
            name: this.name,
            id: this.id,
            quiz_id: this.quizId,
            description: Base64.encode(this.description),
            is_published: this.isPublished,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            token_options: this.tokenOptions.map((entry) => decamelizeKeys(entry.toJSON() as any))
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(configuration: TokenATMConfiguration, data: any): TokenOptionGroup {
        if (
            typeof data['name'] != 'string' ||
            typeof data['id'] != 'number' ||
            typeof data['quiz_id'] != 'string' ||
            (typeof data['description'] != 'undefined' && typeof data['description'] != 'string') ||
            typeof data['is_published'] != 'boolean' ||
            typeof data['token_options'] != 'object' ||
            !Array.isArray(data['token_options'])
        )
            throw new Error('Invalid data');
        const group = new TokenOptionGroup(
            configuration,
            data['name'],
            data['id'],
            data['quiz_id'],
            data['description'] ? Base64.decode(data['description']) : '',
            data['is_published'],
            []
        );
        group.tokenOptions = data['token_options'].map((entry) => configuration.tokenOptionResolver(group, entry));
        return group;
    }
}
