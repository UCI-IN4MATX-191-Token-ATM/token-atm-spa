import * as t from 'io-ts';
import { ModuleMixin, ModuleMixinDataDef } from './mixins/module-mixin';
import { StartTimeMixin, StartTimeMixinDataDef } from './mixins/start-time-mixin';
import { GradeThresholdMixin, GradeThresholdMixinDataDef } from './mixins/grade-threshold-mixin';
import { ATokenOption, TokenOptionDataDef } from './token-option';
import { ToJSONMixin } from './mixins/to-json-mixin';
import { unwrapValidationFunc } from 'app/utils/validation-unwrapper';
import { FromDataMixin } from './mixins/from-data-mixin';

// export class EarnByModuleTokenOption extends TokenOption {
//     private _moduleName: string;
//     private _moduleId: string;
//     private _startTime: Date;
//     private _gradeThreshold: number;

//     constructor(
//         group: TokenOptionGroup,
//         type: string,
//         id: number,
//         name: string,
//         description: string,
//         tokenBalanceChange: number,
//         isMigrating: boolean,
//         moduleName: string,
//         moduleId: string,
//         startTime: Date,
//         gradeThreshold: number
//     ) {
//         super(group, type, id, name, description, tokenBalanceChange, isMigrating);
//         this._moduleName = moduleName;
//         this._moduleId = moduleId;
//         this._startTime = startTime;
//         this._gradeThreshold = gradeThreshold;
//     }

//     public get moduleName(): string {
//         return this._moduleName;
//     }

//     public set moduleName(moduleName: string) {
//         this._moduleName = moduleName;
//     }

//     public get moduleId(): string {
//         return this._moduleId;
//     }

//     public set moduleId(moduleId: string) {
//         this._moduleId = moduleId;
//     }

//     public get startTime(): Date {
//         return this._startTime;
//     }

//     public set startTime(startTime: Date) {
//         this._startTime = startTime;
//     }

//     public get gradeThreshold(): number {
//         return this._gradeThreshold;
//     }

//     public set gradeThreshold(gradeThreshold: number) {
//         this._gradeThreshold = gradeThreshold;
//     }

//     public override toJSON(): object {
//         return {
//             ...super.toJSON(),
//             module_name: this.moduleName,
//             module_id: this.moduleId,
//             start_time: getUnixTime(this.startTime),
//             grade_threshold: this.gradeThreshold
//         };
//     }

//     protected static resolveEarnByModuleTokenOption(
//         group: TokenOptionGroup,
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         data: any
//     ): ConstructorParameters<typeof EarnByModuleTokenOption> {
//         if (
//             typeof data['module_name'] != 'string' ||
//             typeof data['module_id'] != 'string' ||
//             typeof data['start_time'] != 'number' ||
//             typeof data['grade_threshold'] != 'number'
//         )
//             throw new Error('Invalid data');
//         return [
//             ...super.resolveTokenOption(group, data),
//             data['module_name'],
//             data['module_id'],
//             fromUnixTime(data['start_time']),
//             data['grade_threshold']
//         ];
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     public static deserialize(group: TokenOptionGroup, data: any): EarnByModuleTokenOption {
//         return new EarnByModuleTokenOption(...this.resolveEarnByModuleTokenOption(group, data));
//     }
// }

export const EarnByModuleTokenOptionDataDef = t.intersection([
    TokenOptionDataDef,
    ModuleMixinDataDef,
    StartTimeMixinDataDef,
    GradeThresholdMixinDataDef
]);

export type EarnByModuleTokenOptionData = t.TypeOf<typeof EarnByModuleTokenOptionDataDef>;

export class EarnByModuleTokenOption extends FromDataMixin(
    ToJSONMixin(GradeThresholdMixin(StartTimeMixin(ModuleMixin(ATokenOption))), EarnByModuleTokenOptionDataDef.encode),
    unwrapValidationFunc(EarnByModuleTokenOptionDataDef.decode),
    EarnByModuleTokenOptionDataDef.is
) {}
