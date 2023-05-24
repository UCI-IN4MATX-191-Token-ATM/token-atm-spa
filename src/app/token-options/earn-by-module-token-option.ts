import type { TokenOptionGroup } from 'app/data/token-option-group';
import { fromUnixTime, getUnixTime } from 'date-fns';
import { TokenOption } from './token-option';

export class EarnByModuleTokenOption extends TokenOption {
    private _moduleName: string;
    private _moduleId: string;
    private _startTime: Date;
    private _gradeThreshold: number;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(group: TokenOptionGroup, data: any) {
        super(group, data);
        if (
            typeof data['module_name'] != 'string' ||
            typeof data['module_id'] != 'string' ||
            typeof data['start_time'] != 'number' ||
            typeof data['grade_threshold'] != 'number'
        )
            throw new Error('Invalid data');
        this._moduleName = data['module_name'];
        this._moduleId = data['module_id'];
        this._startTime = fromUnixTime(data['start_time']);
        this._gradeThreshold = data['grade_threshold'];
    }

    public get moduleName(): string {
        return this._moduleName;
    }

    public get descriptiveName(): string {
        return 'Earn Tokens by Passing Canvas Module';
    }

    public get moduleId(): string {
        return this._moduleId;
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
            module_name: this.moduleName,
            module_id: this.moduleId,
            start_time: getUnixTime(this.startTime),
            grade_threshold: this.gradeThreshold
        };
    }
}
