import * as t from 'io-ts';
import { Base64StringDef, type Constructor } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export const QuestionProSurveyMixinDataDef = t.strict({
    surveyId: t.string,
    surveyName: Base64StringDef,
    responseField: t.union([
        t.strict({
            type: t.literal('customVariable'),
            variableName: t.string
        }),
        t.strict({
            type: t.literal('studentResponse'),
            questionId: t.string,
            questionName: Base64StringDef
        })
    ])
});

export type QuestionProSurveyMixinData = t.TypeOf<typeof QuestionProSurveyMixinDataDef>;
export type RawQuestionProSurveyMixinData = t.OutputOf<typeof QuestionProSurveyMixinDataDef>;

export type IQuestionProSurvey = QuestionProSurveyMixinData & IGridViewDataSource;

export function QuestionProSurveyMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IQuestionProSurvey {
        surveyId = '';
        surveyName = '';
        responseField:
            | {
                  type: 'customVariable';
                  variableName: string;
              }
            | {
                  type: 'studentResponse';
                  questionId: string;
                  questionName: string;
              } = {
            type: 'customVariable',
            variableName: ''
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'QuestionPro Survey',
                type: 'string',
                value: `${this.surveyName} (${this.surveyId})`
            }));
            this.registerDataPointSource(() => ({
                colName: 'QuestionPro Survey Response Field',
                type: 'string',
                value: `${this.responseField.type}: ${
                    this.responseField.type == 'customVariable'
                        ? this.responseField.variableName
                        : this.responseField.questionName + '(' + this.responseField.questionId + ')'
                }`
            }));
        }
    };
}
