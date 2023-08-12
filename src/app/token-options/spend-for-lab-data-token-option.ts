import * as t from 'io-ts';
import { ATokenOption, TokenOptionDataDef } from './token-option';
import { QuizMixin, QuizMixinDataDef } from './mixins/quiz-mixin';
import { StartTimeMixin, StartTimeMixinDataDef } from './mixins/start-time-mixin';
import { EndTimeMixin, EndTimeMixinDataDef } from './mixins/end-time-mixin';
import { NewDueTimeMixin, NewDueTimeMixinDataDef } from './mixins/new-due-time-mixin';
import { ExcludeTokenOptionIdsMixin, ExcludeTokenOptionIdsMixinDataDef } from './mixins/exclude-token-option-ids-mixin';
import { ToJSONMixin } from './mixins/to-json-mixin';
import { FromDataMixin } from './mixins/from-data-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';

// export class SpendForLabDataTokenOption extends TokenOption {
//     private _quizName: string;
//     private _quizId: string;
//     private _startTime: Date;
//     private _endTime: Date;
//     private _newDueTime: Date;
//     private _excludeTokenOptionIds: number[];

//     constructor(
//         group: TokenOptionGroup,
//         type: string,
//         id: number,
//         name: string,
//         description: string,
//         tokenBalanceChange: number,
//         isMigrating: boolean,
//         quizName: string,
//         quizId: string,
//         startTime: Date,
//         endTime: Date,
//         newDueTime: Date,
//         excludeTokenOptionIds: number[]
//     ) {
//         super(group, type, id, name, description, tokenBalanceChange, isMigrating);
//         this._quizName = quizName;
//         this._quizId = quizId;
//         this._startTime = startTime;
//         this._endTime = endTime;
//         this._newDueTime = newDueTime;
//         this._excludeTokenOptionIds = excludeTokenOptionIds;
//     }

//     public get quizName(): string {
//         return this._quizName;
//     }

//     public set quizName(quizName: string) {
//         this._quizName = quizName;
//     }

//     public get quizId(): string {
//         return this._quizId;
//     }

//     public set quizId(quizId: string) {
//         this._quizId = quizId;
//     }

//     public get startTime(): Date {
//         return this._startTime;
//     }

//     public set startTime(startTime: Date) {
//         this._startTime = startTime;
//     }

//     public get endTime(): Date {
//         return this._endTime;
//     }

//     public set endTime(endTime: Date) {
//         this._endTime = endTime;
//     }

//     public get newDueTime(): Date {
//         return this._newDueTime;
//     }

//     public set newDueTime(newDueTime: Date) {
//         this._newDueTime = newDueTime;
//     }

//     public get excludeTokenOptionIds(): number[] {
//         return this._excludeTokenOptionIds;
//     }

//     public set excludeTokenOptionIds(excludeTokenOptionIds: number[]) {
//         this._excludeTokenOptionIds = excludeTokenOptionIds;
//     }

//     public override toJSON(): object {
//         return {
//             ...super.toJSON(),
//             quiz_name: this.quizName,
//             quiz_id: this.quizId,
//             start_time: getUnixTime(this.startTime),
//             end_time: getUnixTime(this.endTime),
//             new_due_time: getUnixTime(this.newDueTime),
//             exclude_token_option_ids: this._excludeTokenOptionIds
//         };
//     }

//     protected static resolveSpendForLabDataTokenOption(
//         group: TokenOptionGroup,
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         data: any
//     ): ConstructorParameters<typeof SpendForLabDataTokenOption> {
//         if (
//             typeof data['quiz_name'] != 'string' ||
//             typeof data['quiz_id'] != 'string' ||
//             typeof data['start_time'] != 'number' ||
//             typeof data['end_time'] != 'number' ||
//             typeof data['new_due_time'] != 'number' ||
//             (typeof data['exclude_token_option_ids'] != 'undefined' &&
//                 typeof data['exclude_token_option_ids'] != 'object') ||
//             (typeof data['exclude_token_option_ids'] == 'object' && !Array.isArray(data['exclude_token_option_ids']))
//         )
//             throw new Error('Invalid data');
//         if (data['exclude_token_option_ids'] != undefined)
//             for (const id of data['exclude_token_option_ids']) {
//                 if (typeof id != 'number') throw new Error('Invalid data');
//             }
//         return [
//             ...super.resolveTokenOption(group, data),
//             data['quiz_name'],
//             data['quiz_id'],
//             fromUnixTime(data['start_time']),
//             fromUnixTime(data['end_time']),
//             fromUnixTime(data['new_due_time']),
//             data['exclude_token_option_ids'] ?? []
//         ];
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     public static deserialize(group: TokenOptionGroup, data: any): SpendForLabDataTokenOption {
//         return new SpendForLabDataTokenOption(...this.resolveSpendForLabDataTokenOption(group, data));
//     }
// }

export const SpendForLabDataTokenOptionDataDef = t.intersection([
    t.intersection([
        TokenOptionDataDef,
        QuizMixinDataDef,
        StartTimeMixinDataDef,
        EndTimeMixinDataDef,
        NewDueTimeMixinDataDef
    ]),
    ExcludeTokenOptionIdsMixinDataDef
]);

export type SpendForLabDataTokenOptionData = t.TypeOf<typeof SpendForLabDataTokenOptionDataDef>;
export type RawSpendForLabDataTokenOptionData = t.OutputOf<typeof SpendForLabDataTokenOptionDataDef>;

export class SpendForLabDataTokenOption extends FromDataMixin(
    ToJSONMixin(
        ExcludeTokenOptionIdsMixin(NewDueTimeMixin(EndTimeMixin(StartTimeMixin(QuizMixin(ATokenOption))))),
        SpendForLabDataTokenOptionDataDef.encode
    ),
    unwrapValidationFunc(SpendForLabDataTokenOptionDataDef.decode),
    SpendForLabDataTokenOptionDataDef.is
) {}
