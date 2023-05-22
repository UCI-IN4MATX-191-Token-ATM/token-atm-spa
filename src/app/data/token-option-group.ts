import type { TokenATMConfiguration } from './token-atm-configuration';
import type { TokenOption } from '../token-options/token-option';

export class TokenOptionGroup {
    private _configuration: TokenATMConfiguration;
    private _name: string;
    private _id: number;
    private _quizId: string;
    private _description: string;
    private _tokenOptions: TokenOption[];

    constructor(
        configuration: TokenATMConfiguration,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tokenOptionResolver: (group: TokenOptionGroup, data: any) => TokenOption
    ) {
        this._configuration = configuration;
        if (
            typeof data['name'] != 'string' ||
            typeof data['id'] != 'number' ||
            typeof data['quiz_id'] != 'string' ||
            (typeof data['description'] != 'undefined' && typeof data['description'] != 'string') ||
            typeof data['token_options'] != 'object' ||
            !Array.isArray(data['token_options'])
        )
            throw new Error('Invalid data');
        this._name = data['name'];
        this._id = data['id'];
        this._quizId = data['quiz_id'];
        this._description = data['description'] ?? '';
        this._tokenOptions = data['token_options'].map((entry) => tokenOptionResolver(this, entry));
    }

    public get configuration(): TokenATMConfiguration {
        return this._configuration;
    }

    public get name(): string {
        return this._name;
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

    public get tokenOptions(): TokenOption[] {
        return this._tokenOptions;
    }

    public addTokenOption(tokenOption: TokenOption): void {
        this._tokenOptions.push(tokenOption);
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
            description: this.description,
            token_options: this.tokenOptions.map((entry) => entry.toJSON())
        };
    }
}
