import * as t from 'io-ts';
import { ATokenOption, TokenOptionDataDef } from '../token-option';
import { AssignmentMixin, AssignmentMixinDataDef } from '../mixins/assignment-mixin';
import { StartTimeMixin, StartTimeMixinDataDef } from '../mixins/start-time-mixin';
import {
    MultipleSectionEndTimeMixin,
    MultipleSectionEndTimeMixinDataDef
} from '../mixins/multiple-section-end-time-mixin';
import {
    MultipleSectionNewDueTimeMixin,
    MultipleSectionNewDueTimeMixinDataDef
} from '../mixins/multiple-section-new-due-time-mixin';
import { ToJSONMixin } from '../mixins/to-json-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import { FromDataMixin } from '../mixins/from-data-mixin';

// export class SpendForAssignmentResubmissionTokenOption extends TokenOption {
//     private _assignmentName: string;
//     private _assignmentId: string;
//     private _startTime: Date;
//     private _endTime: Date | MultipleSectionDateMatcher;
//     private _newDueTime: Date | MultipleSectionDateMatcher;

//     constructor(
//         group: TokenOptionGroup,
//         type: string,
//         id: number,
//         name: string,
//         description: string,
//         tokenBalanceChange: number,
//         isMigrating: boolean,
//         assignmentName: string,
//         assignmentId: string,
//         startTime: Date,
//         endTime: Date | MultipleSectionDateMatcher,
//         newDueTime: Date | MultipleSectionDateMatcher
//     ) {
//         super(group, type, id, name, description, tokenBalanceChange, isMigrating);
//         this._assignmentName = assignmentName;
//         this._assignmentId = assignmentId;
//         this._startTime = startTime;
//         this._endTime = endTime;
//         this._newDueTime = newDueTime;
//     }

//     public get assignmentName(): string {
//         return this._assignmentName;
//     }

//     public set assignmentName(assignmentName: string) {
//         this._assignmentName = assignmentName;
//     }

//     public get assignmentId(): string {
//         return this._assignmentId;
//     }

//     public set assignmentId(assignmentId: string) {
//         this._assignmentId = assignmentId;
//     }

//     public get startTime(): Date {
//         return this._startTime;
//     }

//     public set startTime(startTime: Date) {
//         this._startTime = startTime;
//     }

//     public get endTime(): Date | MultipleSectionDateMatcher {
//         return this._endTime;
//     }

//     public set endTime(endTime: Date | MultipleSectionDateMatcher) {
//         this._endTime = endTime;
//     }

//     public get newDueTime(): Date | MultipleSectionDateMatcher {
//         return this._newDueTime;
//     }

//     public set newDueTime(newDueTime: Date | MultipleSectionDateMatcher) {
//         this._newDueTime = newDueTime;
//     }

//     public override toJSON(): object {
//         return {
//             ...super.toJSON(),
//             assignment_name: this.assignmentName,
//             assignment_id: this.assignmentId,
//             start_time: getUnixTime(this.startTime),
//             end_time: this.endTime instanceof Date ? getUnixTime(this.endTime) : this.endTime.toJSON(),
//             new_due_time: this.newDueTime instanceof Date ? getUnixTime(this.newDueTime) : this.newDueTime.toJSON()
//         };
//     }

//     protected static resolveSpendForAssignmentResubmissionTokenOption(
//         group: TokenOptionGroup,
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         data: any
//     ): ConstructorParameters<typeof SpendForAssignmentResubmissionTokenOption> {
//         if (
//             typeof data['assignment_name'] != 'string' ||
//             typeof data['assignment_id'] != 'string' ||
//             typeof data['start_time'] != 'number' ||
//             (typeof data['end_time'] != 'number' && typeof data['end_time'] != 'object') ||
//             (typeof data['new_due_time'] != 'number' && typeof data['new_due_time'] != 'object')
//         )
//             throw new Error('Invalid data');
//         return [
//             ...super.resolveTokenOption(group, data),
//             data['assignment_name'],
//             data['assignment_id'],
//             fromUnixTime(data['start_time']),
//             typeof data['end_time'] == 'number'
//                 ? fromUnixTime(data['end_time'])
//                 : MultipleSectionDateMatcher.deserialize(data['end_time']),
//             typeof data['new_due_time'] == 'number'
//                 ? fromUnixTime(data['new_due_time'])
//                 : MultipleSectionDateMatcher.deserialize(data['new_due_time'])
//         ];
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     public static deserialize(group: TokenOptionGroup, data: any): SpendForAssignmentResubmissionTokenOption {
//         return new SpendForAssignmentResubmissionTokenOption(
//             ...this.resolveSpendForAssignmentResubmissionTokenOption(group, data)
//         );
//     }
// }

export const SpendForAssignmentResubmissionTokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    AssignmentMixinDataDef,
    StartTimeMixinDataDef,
    MultipleSectionEndTimeMixinDataDef,
    MultipleSectionNewDueTimeMixinDataDef
]);

export type SpendForAssignmentResubmissionTokenOptionData = t.TypeOf<
    typeof SpendForAssignmentResubmissionTokenOptionDataDef
>;
export type RawSpendForAssignmentResubmissionTokenOptionData = t.OutputOf<
    typeof SpendForAssignmentResubmissionTokenOptionDataDef
>;

export class SpendForAssignmentResubmissionTokenOption extends FromDataMixin(
    ToJSONMixin(
        MultipleSectionNewDueTimeMixin(MultipleSectionEndTimeMixin(StartTimeMixin(AssignmentMixin(ATokenOption)))),
        SpendForAssignmentResubmissionTokenOptionDataDef.encode
    ),
    unwrapValidationFunc(SpendForAssignmentResubmissionTokenOptionDataDef.decode),
    SpendForAssignmentResubmissionTokenOptionDataDef.is
) {}
