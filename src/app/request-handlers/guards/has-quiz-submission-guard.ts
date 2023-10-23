import type { CanvasService } from 'app/services/canvas.service';
import { RequestHandlerGuard } from './request-handler-guard';

export class HasQuizSubmissionGuard extends RequestHandlerGuard {
    constructor(
        private courseId: string,
        private quizId: string,
        private studentId: string,
        private canvasService: CanvasService
    ) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        const assignmentId = await this.canvasService.getAssignmentIdByQuizId(this.courseId, this.quizId);
        const submission = await this.canvasService.getAssignmentSubmission(
            this.courseId,
            assignmentId,
            this.studentId
        );
        if (submission.workflowState == 'unsubmitted') {
            onReject('You haven’t taken the quiz yet');
            return;
        }
    }
}
