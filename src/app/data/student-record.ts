import { ProcessedRequest } from './processed-request';
import type { Student } from './student';
import type { TokenATMConfiguration } from './token-atm-configuration';

export class StudentRecord {
    private _configuration: TokenATMConfiguration;
    private _student: Student;
    private _commentId: string;
    private _tokenBalance: number;
    private _processedAttemptsMap: Map<number, number>;
    private _processedRequests: ProcessedRequest[];

    constructor(
        configuration: TokenATMConfiguration,
        student: Student,
        commentId: string,
        tokenBalance: number,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any
    ) {
        if (
            typeof data['processed_attempt_map'] != 'object' ||
            !Array.isArray(data['processed_attempt_map']) ||
            typeof data['processed_requests'] != 'object' ||
            !Array.isArray(data['processed_requests'])
        )
            throw new Error('Invalid data');
        this._configuration = configuration;
        this._student = student;
        this._commentId = commentId;
        this._tokenBalance = tokenBalance;
        this._processedAttemptsMap = new Map<number, number>();
        for (const entry of data['processed_attempt_map']) {
            if (typeof entry['token_option_group_id'] != 'number' || typeof entry['attempt'] != 'number')
                throw new Error('Invalid data');
            this._processedAttemptsMap.set(entry['token_option_group_id'], entry['attempt']);
        }
        this._processedRequests = data['processed_requests'].map(
            (entry) => new ProcessedRequest(configuration, student, entry)
        );
    }

    public get configuration(): TokenATMConfiguration {
        return this._configuration;
    }

    public get student(): Student {
        return this._student;
    }

    public get commentId(): string {
        return this._commentId;
    }

    public set commentId(commentId: string) {
        this._commentId = commentId;
    }

    public get tokenBalance(): number {
        return this._tokenBalance;
    }

    public get processedRequests(): ProcessedRequest[] {
        return this._processedRequests;
    }

    public logProcessedRequest(processedRequest: ProcessedRequest) {
        if (!processedRequest.tokenOption) throw new Error('Invalid processed request');
        if (processedRequest.isApproved) this._tokenBalance += processedRequest.tokenOption.tokenBalanceChange;
        this._processedAttemptsMap.set(
            processedRequest.tokenOption.id,
            (this._processedAttemptsMap.get(processedRequest.tokenOption.id) ?? 0) + 1
        );
        this._processedRequests.push(processedRequest);
    }

    public getProcessedAttempts(tokenOptionGroupId: number): number {
        return this._processedAttemptsMap.get(tokenOptionGroupId) ?? 0;
    }

    public toJSON(): unknown {
        return {
            processed_attempt_map: [...this._processedAttemptsMap.entries()].map((entry) => {
                return {
                    token_option_group_id: entry[0],
                    attempt: entry[1]
                };
            }),
            processed_requests: this.processedRequests
        };
    }
}
