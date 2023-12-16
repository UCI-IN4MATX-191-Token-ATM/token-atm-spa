import * as t from 'io-ts';
import { ATokenOption, TokenOptionDataDef } from './token-option';
import { QualtricsSurveyMixin, QualtricsSurveyMixinDataDef } from './mixins/qualtrics-survey-mixin';
import { StartTimeMixin, StartTimeMixinDataDef } from './mixins/start-time-mixin';
import { EndTimeMixin, EndTimeMixinDataDef } from './mixins/end-time-mixin';
import { ToJSONMixin } from './mixins/to-json-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import { FromDataMixin } from './mixins/from-data-mixin';
import { RequireCredentials } from 'app/services/credential-manager.service';

// export class EarnBySurveyTokenOption extends TokenOption {
//     private _surveyId: string;
//     private _fieldName: string;
//     private _startTime: Date;
//     private _endTime: Date;

//     constructor(
//         group: TokenOptionGroup,
//         type: string,
//         id: number,
//         name: string,
//         description: string,
//         tokenBalanceChange: number,
//         isMigrating: boolean,
//         surveyId: string,
//         fieldName: string,
//         startTime: Date,
//         endTime: Date
//     ) {
//         super(group, type, id, name, description, tokenBalanceChange, isMigrating);
//         this._surveyId = surveyId;
//         this._fieldName = fieldName;
//         this._startTime = startTime;
//         this._endTime = endTime;
//     }

//     public get surveyId(): string {
//         return this._surveyId;
//     }

//     public set surveyId(surveyId: string) {
//         this._surveyId = surveyId;
//     }

//     public get fieldName(): string {
//         return this._fieldName;
//     }

//     public set fieldName(fieldName: string) {
//         this._fieldName = fieldName;
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

//     public override toJSON(): object {
//         return {
//             ...super.toJSON(),
//             quiz_id: this.surveyId,
//             field_name: this.fieldName,
//             start_time: getUnixTime(this.startTime),
//             end_time: getUnixTime(this.endTime)
//         };
//     }

//     protected static resolveEarnByQuizTokenOption(
//         group: TokenOptionGroup,
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         data: any
//     ): ConstructorParameters<typeof EarnBySurveyTokenOption> {
//         if (
//             typeof data['quiz_id'] != 'string' ||
//             typeof data['field_name'] != 'string' ||
//             typeof data['start_time'] != 'number' ||
//             typeof data['end_time'] != 'number'
//         )
//             throw new Error('Invalid data');
//         return [
//             ...super.resolveTokenOption(group, data),
//             data['quiz_id'],
//             data['field_name'],
//             fromUnixTime(data['start_time']),
//             fromUnixTime(data['end_time'])
//         ];
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     public static deserialize(group: TokenOptionGroup, data: any): EarnBySurveyTokenOption {
//         return new EarnBySurveyTokenOption(...this.resolveEarnByQuizTokenOption(group, data));
//     }
// }

/**
 * The definition of `EarnBySurveyTokenOptionData`.
 */
export const EarnBySurveyTokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    QualtricsSurveyMixinDataDef,
    StartTimeMixinDataDef,
    EndTimeMixinDataDef
]);

/**
 * The compile-time type of `EarnBySurveyTokenOptionData`;
 */
export type EarnBySurveyTokenOptionData = t.TypeOf<typeof EarnBySurveyTokenOptionDataDef>;

/**
 * The compile-time type of encoded form of `EarnBySurveyTokenOptionData`.
 */
export type RawEarnBySurveyTokenOptionData = t.OutputOf<typeof EarnBySurveyTokenOptionDataDef>;

@RequireCredentials('qualtrics')
export class EarnBySurveyTokenOption extends FromDataMixin(
    ToJSONMixin(
        EndTimeMixin(StartTimeMixin(QualtricsSurveyMixin(ATokenOption))),
        EarnBySurveyTokenOptionDataDef.encode
    ),
    unwrapValidationFunc(EarnBySurveyTokenOptionDataDef.decode),
    EarnBySurveyTokenOptionDataDef.is
) {}
