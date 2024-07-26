import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export const QuizMixinDataDef = t.strict({
    quizName: t.string,
    quizId: t.string
});

export type QuizMixinData = t.TypeOf<typeof QuizMixinDataDef>;
export type RawQuizMixinData = t.OutputOf<typeof QuizMixinDataDef>;

export type IQuiz = QuizMixinData & IGridViewDataSource;

export function QuizMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IQuiz {
        quizName = '';
        quizId = '';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'Canvas Quiz Name',
                type: 'string',
                value: this.quizName
            }));
        }
    };
}
