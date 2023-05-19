import type { TokenOption } from 'app/token-options/token-option';
import { fromUnixTime, getUnixTime } from 'date-fns';
import type { Student } from './student';
import type { TokenATMConfiguration } from './token-atm-configuration';

export class ProcessedRequest {
    private _configuration: TokenATMConfiguration;
    private _tokenOptionId: number;
    private _tokenOption?: TokenOption;
    private _tokenOptionName: string;
    private _student: Student;
    private _isApproved: boolean;
    private _submitTime: Date;
    private _processTime: Date;
    private _message?: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(configuration: TokenATMConfiguration, student: Student, data: any) {
        if (
            typeof data['token_option_id'] != 'number' ||
            typeof data['token_option_name'] != 'string' ||
            typeof data['is_approved'] != 'boolean' ||
            (typeof data['message'] != 'undefined' && typeof data['message'] != 'string') ||
            typeof data['submit_time'] != 'number' ||
            typeof data['process_time'] != 'number'
        )
            throw new Error('Invalid data');
        this._configuration = configuration;
        this._tokenOptionId = data['token_option_id'];
        this._tokenOption = configuration.getTokenOptionById(data['token_option_id']);
        this._tokenOptionName = data['token_option_name'];
        this._student = student;
        this._isApproved = data['is_approved'];
        this._submitTime = fromUnixTime(data['submit_time']);
        this._processTime = fromUnixTime(data['process_time']);
        this._message = data['message'];
    }

    public get configuration(): TokenATMConfiguration {
        return this._configuration;
    }

    public get tokenOption(): TokenOption | undefined {
        return this._tokenOption;
    }

    public get tokenOptionName(): string {
        return this._tokenOptionName;
    }

    public get student(): Student {
        return this._student;
    }

    public get isApproved(): boolean {
        return this._isApproved;
    }

    public get submitTime(): Date {
        return this._submitTime;
    }

    public get processTime(): Date {
        return this._processTime;
    }

    public get message(): string {
        return this._message ?? '';
    }

    public toJSON(): unknown {
        return {
            token_option_id: this._tokenOptionId,
            token_option_name: this.tokenOptionName,
            is_approved: this.isApproved,
            submit_time: getUnixTime(this.submitTime),
            process_time: getUnixTime(this.processTime),
            message: this._message
        };
    }
}
