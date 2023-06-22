import type { CanvasService } from 'app/services/canvas.service';
import { RequestHandlerGuard } from './request-handler-guard';

export class NoQuizSubmissionGuard extends RequestHandlerGuard {
    constructor(
        private courseId: string,
        private quizId: string,
        private studentId: string,
        private overrideTitlePrefix: string,
        private lockDate: Date,
        private canvasService: CanvasService
    ) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        const assignmentId = await this.canvasService.getAssignmentIdByQuizId(this.courseId, this.quizId);
        await this.canvasService.deleteAssignmentOverrideForStudent(this.courseId, assignmentId, this.studentId);
        for await (const submission of await this.canvasService.getQuizSubmissions(this.courseId, this.quizId)) {
            if (submission.studentId != this.studentId) continue;
            await this.canvasService.createAssignmentOverrideForStudent(
                this.courseId,
                assignmentId,
                this.studentId,
                this.overrideTitlePrefix,
                this.lockDate
            );
            onReject('You have already started taking the quiz, or you have already taken the quiz.');
            return;
        }
    }
}
