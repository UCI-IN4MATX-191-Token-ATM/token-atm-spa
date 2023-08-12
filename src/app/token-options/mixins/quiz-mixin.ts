import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';

export const QuizMixinDataDef = t.strict({
    quizName: t.string,
    quizId: t.string
});

export type QuizMixinData = t.TypeOf<typeof QuizMixinDataDef>;
export type RawQuizMixinData = t.OutputOf<typeof QuizMixinDataDef>;

export type IQuiz = QuizMixinData;

export function QuizMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements IQuiz {
        quizName = '';
        quizId = '';
    };
}
