import type { CanvasService } from 'app/services/canvas.service';
import { RequestHandlerGuard } from './request-handler-guard';

export class QuizGradeThresholdGuard extends RequestHandlerGuard {
    constructor(
        private courseId: string,
        private quizId: string,
        private studentId: string,
        private gradeThreshold: number,
        private canvasService: CanvasService
    ) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        const quiz = await this.canvasService.getQuiz(this.courseId, this.quizId);
        const grade = await this.canvasService.getSingleSubmissionGrade(
            this.courseId,
            this.studentId,
            quiz.assignmentId
        );
        if (quiz.pointsPossible != 0 && grade / quiz.pointsPossible < this.gradeThreshold) {
            onReject(
                `Quiz score ${grade}/${quiz.pointsPossible}  (${((grade / quiz.pointsPossible) * 100).toFixed(
                    2
                )}%) is lower than the threshold (${(this.gradeThreshold * 100).toFixed(2)}%).`
            );
        }
    }
}
