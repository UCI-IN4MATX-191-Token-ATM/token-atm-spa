import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

interface SurveyIDData {
    surveyId: string;
}

interface RawSurveyIDData {
    quizId: string;
}

const SurveyIDDataDef = new t.Type<SurveyIDData, RawSurveyIDData, unknown>(
    'Survey ID',
    (v): v is SurveyIDData => typeof (v as SurveyIDData)['surveyId'] == 'string',
    (v, ctx) => {
        const valueA = (v as SurveyIDData).surveyId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            valueB = (v as any).quizId;
        if (valueA != undefined || valueB != undefined) {
            return t.success({
                surveyId: valueA ?? valueB
            });
        }
        return t.failure(v, ctx);
    },
    (v) => {
        return {
            quizId: v.surveyId
        };
    }
);

export const QualtricsSurveyMixinDataDef = t.intersection([
    SurveyIDDataDef,
    t.strict({
        fieldName: t.string
    })
]);

export type QualtricsSurveyMixinData = t.TypeOf<typeof QualtricsSurveyMixinDataDef>;
export type RawQualtricsSurveyMixinData = t.OutputOf<typeof QualtricsSurveyMixinDataDef>;

export type IQualtricsSurvey = QualtricsSurveyMixinData & IGridViewDataSource;

export function QualtricsSurveyMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IQualtricsSurvey {
        surveyId = '';
        fieldName = '';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'Qualtrics Survey ID',
                type: 'string',
                value: this.surveyId
            }));
            this.registerDataPointSource(() => ({
                colName: 'Qualtrics Survey Field Name',
                type: 'string',
                value: this.fieldName
            }));
        }
    };
}
