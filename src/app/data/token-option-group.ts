import type { TokenATMConfiguration } from './token-atm-configuration';
import type { TokenOption } from '../token-options/token-option';

export class TokenOptionGroup {
    private _configuration: TokenATMConfiguration;
    private _name: string;
    private _id: number;
    private _quizId: string;
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
            typeof data['token_options'] != 'object' ||
            !Array.isArray(data['token_options'])
        )
            throw new Error('Invalid data');
        this._name = data['name'];
        this._id = data['id'];
        this._quizId = data['quiz_id'];
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

    public get tokenOptions(): TokenOption[] {
        return this._tokenOptions;
    }
}
