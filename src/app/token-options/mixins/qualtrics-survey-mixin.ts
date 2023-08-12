import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';

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

export type IQualtricsSurvey = QualtricsSurveyMixinData;

export function QualtricsSurveyMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements IQualtricsSurvey {
        surveyId = '';
        fieldName = '';
    };
}
