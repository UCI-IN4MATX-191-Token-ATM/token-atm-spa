import type { Course } from './course';
import type { TokenOption } from '../token-options/token-option';
import { TokenOptionGroup } from './token-option-group';

export class TokenATMConfiguration {
    private _course: Course;
    private _logAssignmentId: string;
    private _tokenOptionGroups: TokenOptionGroup[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(course: Course, data: any, tokenOptionResolver: (group: TokenOptionGroup, data: any) => TokenOption) {
        this._course = course;
        if (
            typeof data['log_assignment_id'] != 'string' ||
            typeof data['token_option_groups'] != 'object' ||
            !Array.isArray(data['token_option_groups'])
        )
            throw new Error('Invalid data');
        this._logAssignmentId = data['log_assignment_id'];
        this._tokenOptionGroups = data['token_option_groups'].map(
            (entry) => new TokenOptionGroup(this, entry, tokenOptionResolver)
        );
    }

    public get course(): Course {
        return this._course;
    }

    public get logAssignmentId(): string {
        return this._logAssignmentId;
    }

    public get tokenOptionGroups(): TokenOptionGroup[] {
        return this._tokenOptionGroups;
    }

    public getTokenOptionGroupById(id: number): TokenOptionGroup | undefined {
        // TODO: maintain a Map separately for better performance
        for (const group of this.tokenOptionGroups) if (group.id == id) return group;
        return undefined;
    }

    public getTokenOptionById(id: number): TokenOption | undefined {
        for (const group of this.tokenOptionGroups)
            for (const option of group.tokenOptions) if (option.id == id) return option;
        return undefined;
    }
}
