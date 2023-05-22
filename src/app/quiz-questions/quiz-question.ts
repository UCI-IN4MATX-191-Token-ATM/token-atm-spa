export abstract class QuizQuestion {
    private _name: string;
    private _text: string;
    private _pointsPossible: number;

    constructor(name = 'Question', text = '', pointsPossible = 0) {
        this._name = name;
        this._text = text;
        this._pointsPossible = pointsPossible;
    }

    public get name(): string {
        return this._name;
    }

    public get text(): string {
        return this._text;
    }

    public get pointsPossible(): number {
        return this._pointsPossible;
    }

    public abstract get questionType(): string;

    public toJSON(): object {
        return {
            question_name: this.name,
            question_text: this.text,
            question_type: this.questionType,
            points_possible: this.pointsPossible
        };
    }
}
