import { QuizQuestion } from './quiz-question';

export class MultipleChoiceQuestion extends QuizQuestion {
    private _options: string[];

    constructor(name = 'Question', text = '', pointsPossible = 0, options: string[] = []) {
        super(name, text, pointsPossible);
        this._options = options;
    }

    public get options(): string[] {
        return this._options;
    }

    public get questionType(): string {
        return 'multiple_choice_question';
    }

    public override toJSON(): object {
        const answers = this.options.map((optionText) => {
            return {
                answer_text: optionText
            };
        });
        return {
            ...super.toJSON(),
            answers: answers
        };
    }
}
