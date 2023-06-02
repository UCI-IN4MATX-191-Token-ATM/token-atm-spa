import type { TokenOptionGroup } from 'app/data/token-option-group';
import { fromUnixTime, getUnixTime } from 'date-fns';
import { TokenOption } from './token-option';

export class EarnByQuizTokenOption extends TokenOption {
    private _quizName: string;
    private _quizId: string;
    private _startTime: Date;
    private _gradeThreshold: number;

    constructor(
        group: TokenOptionGroup,
        type: string,
        id: number,
        name: string,
        description: string,
        tokenBalanceChange: number,
        quizName: string,
        quizId: string,
        startTime: Date,
        gradeThreshold: number
    ) {
        super(group, type, id, name, description, tokenBalanceChange);
        this._quizName = quizName;
        this._quizId = quizId;
        this._startTime = startTime;
        this._gradeThreshold = gradeThreshold;
    }

    public get descriptiveName(): string {
        return 'Earn Tokens by Passing Canvas Quiz';
    }

    public get quizName(): string {
        return this._quizName;
    }

    public get quizId(): string {
        return this._quizId;
    }

    public set quizId(quizId: string) {
        this._quizId = quizId;
    }

    public get startTime(): Date {
        return this._startTime;
    }

    public get gradeThreshold(): number {
        return this._gradeThreshold;
    }

    public override toJSON(): object {
        return {
            ...super.toJSON(),
            quiz_name: this.quizName,
            quiz_id: this.quizId,
            start_time: getUnixTime(this._startTime),
            grade_threshold: this.gradeThreshold
        };
    }

    protected static resolveEarnByQuizTokenOption(
        group: TokenOptionGroup,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any
    ): ConstructorParameters<typeof EarnByQuizTokenOption> {
        if (
            typeof data['quiz_name'] != 'string' ||
            typeof data['quiz_id'] != 'string' ||
            typeof data['start_time'] != 'number' ||
            typeof data['grade_threshold'] != 'number'
        )
            throw new Error('Invalid data');
        return [
            ...super.resolveTokenOption(group, data),
            data['quiz_name'],
            data['quiz_id'],
            fromUnixTime(data['start_time']),
            data['grade_threshold']
        ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(group: TokenOptionGroup, data: any): EarnByQuizTokenOption {
        return new EarnByQuizTokenOption(...this.resolveEarnByQuizTokenOption(group, data));
    }
}
