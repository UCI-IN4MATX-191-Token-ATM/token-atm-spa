import type { TokenOption } from 'app/token-options/token-option';
import { fromUnixTime, getUnixTime } from 'date-fns';
import type { Student } from './student';
import type { TokenATMConfiguration } from './token-atm-configuration';

export class ProcessedRequest {
    private _configuration: TokenATMConfiguration;
    private _tokenOptionId: number;
    private _tokenOption?: TokenOption;
    private _tokenOptionName: string;
    private _tokenOptionGroupId?: number;
    private _student: Student;
    private _isApproved: boolean;
    private _submittedTime: Date;
    private _processedTime: Date;
    private _tokenBalanceChange: number;
    private _message?: string;

    constructor(
        configuration: TokenATMConfiguration,
        tokenOptionId: number,
        tokenOptionName: string,
        student: Student,
        isApproved: boolean,
        submittedTime: Date,
        processedTime: Date,
        tokenBalanceChange: number,
        message?: string,
        tokenOptionGroupId?: number
    ) {
        this._configuration = configuration;
        this._tokenOptionId = tokenOptionId;
        this._tokenOption = configuration.getTokenOptionById(tokenOptionId);
        this._tokenOptionName = tokenOptionName;
        this._tokenOptionGroupId = tokenOptionGroupId;
        this._student = student;
        this._isApproved = isApproved;
        this._submittedTime = submittedTime;
        this._processedTime = processedTime;
        this._tokenBalanceChange = tokenBalanceChange;
        this._message = message;
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

    public get tokenOptionGroupId(): number | undefined {
        return this._tokenOptionGroupId;
    }

    public get student(): Student {
        return this._student;
    }

    public get isApproved(): boolean {
        return this._isApproved;
    }

    public get submittedTime(): Date {
        return this._submittedTime;
    }

    public get processedTime(): Date {
        return this._processedTime;
    }

    public get message(): string {
        return this._message ?? '';
    }

    public get tokenBalanceChange(): number {
        return this._tokenBalanceChange;
    }

    public toJSON(): unknown {
        return {
            token_option_id: this._tokenOptionId,
            token_option_name: this.tokenOptionName,
            token_option_group_id: this.tokenOptionGroupId,
            is_approved: this.isApproved,
            submit_time: getUnixTime(this.submittedTime),
            process_time: getUnixTime(this.processedTime),
            message: this.message,
            token_balance_change: this.tokenBalanceChange
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(configuration: TokenATMConfiguration, student: Student, data: any): ProcessedRequest {
        if (
            typeof data['token_option_id'] != 'number' ||
            typeof data['token_option_name'] != 'string' ||
            (typeof data['token_option_group_id'] != 'undefined' && typeof data['token_option_group_id'] != 'number') ||
            typeof data['is_approved'] != 'boolean' ||
            (typeof data['message'] != 'undefined' && typeof data['message'] != 'string') ||
            typeof data['submit_time'] != 'number' ||
            typeof data['process_time'] != 'number' ||
            typeof data['token_balance_change'] != 'number'
        )
            throw new Error('Invalid data');
        return new ProcessedRequest(
            configuration,
            data['token_option_id'],
            data['token_option_name'],
            student,
            data['is_approved'],
            fromUnixTime(data['submit_time']),
            fromUnixTime(data['process_time']),
            data['token_balance_change'],
            data['message'],
            data['token_option_group_id']
        );
    }
}
