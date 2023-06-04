import type { TokenOptionGroup } from 'app/data/token-option-group';
import { fromUnixTime, getUnixTime } from 'date-fns';
import { TokenOption } from './token-option';

export class SpendForAssignmentResubmissionTokenOption extends TokenOption {
    private _assignmentName: string;
    private _assignmentId: string;
    private _startTime: Date;
    private _endTime: Date;
    private _newDueTime: Date;

    constructor(
        group: TokenOptionGroup,
        type: string,
        id: number,
        name: string,
        description: string,
        tokenBalanceChange: number,
        assignmentName: string,
        assignmentId: string,
        startTime: Date,
        endTime: Date,
        newDueTime: Date
    ) {
        super(group, type, id, name, description, tokenBalanceChange);
        this._assignmentName = assignmentName;
        this._assignmentId = assignmentId;
        this._startTime = startTime;
        this._endTime = endTime;
        this._newDueTime = newDueTime;
    }

    public get assignmentName(): string {
        return this._assignmentName;
    }

    public set assignmentName(assignmentName: string) {
        this._assignmentName = assignmentName;
    }

    public get assignmentId(): string {
        return this._assignmentId;
    }

    public set assignmentId(assignmentId: string) {
        this._assignmentId = assignmentId;
    }

    public get startTime(): Date {
        return this._startTime;
    }

    public set startTime(startTime: Date) {
        this._startTime = startTime;
    }

    public get endTime(): Date {
        return this._endTime;
    }

    public set endTime(endTime: Date) {
        this._endTime = endTime;
    }

    public get newDueTime(): Date {
        return this._newDueTime;
    }

    public set newDueTime(newDueTime: Date) {
        this._newDueTime = newDueTime;
    }

    public override toJSON(): object {
        return {
            ...super.toJSON(),
            assignment_name: this.assignmentName,
            assignment_id: this.assignmentId,
            start_time: getUnixTime(this.startTime),
            end_time: getUnixTime(this.endTime),
            new_due_time: getUnixTime(this.newDueTime)
        };
    }

    protected static resolveSpendForAssignmentResubmissionTokenOption(
        group: TokenOptionGroup,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any
    ): ConstructorParameters<typeof SpendForAssignmentResubmissionTokenOption> {
        if (
            typeof data['assignment_name'] != 'string' ||
            typeof data['assignment_id'] != 'string' ||
            typeof data['start_time'] != 'number' ||
            typeof data['end_time'] != 'number' ||
            typeof data['new_due_time'] != 'number'
        )
            throw new Error('Invalid data');
        return [
            ...super.resolveTokenOption(group, data),
            data['assignment_name'],
            data['assignment_id'],
            fromUnixTime(data['start_time']),
            fromUnixTime(data['end_time']),
            fromUnixTime(data['new_due_time'])
        ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(group: TokenOptionGroup, data: any): SpendForAssignmentResubmissionTokenOption {
        return new SpendForAssignmentResubmissionTokenOption(
            ...this.resolveSpendForAssignmentResubmissionTokenOption(group, data)
        );
    }
}
