import type { CanvasService } from 'app/services/canvas.service';
import { RequestHandlerGuard } from './request-handler-guard';

export class NoAssignmentSubmissionGuard extends RequestHandlerGuard {
    constructor(
        private courseId: string,
        private assignmentId: string,
        private studentId: string,
        private overrideTitle: string,
        private lockDate: Date,
        private canvasService: CanvasService
    ) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        await this.canvasService.removeStudentFromAssignmentOverrideByOverrideTitle(
            this.courseId,
            this.assignmentId,
            this.overrideTitle,
            this.studentId,
            this.lockDate
        );
        const submission = await this.canvasService.getAssignmentSubmission(
            this.courseId,
            this.assignmentId,
            this.studentId
        );
        if (submission.workflowState != 'unsubmitted') {
            await this.canvasService.addStudentToAssignmentOverrideByOverrideTitle(
                this.courseId,
                this.assignmentId,
                this.overrideTitle,
                this.studentId,
                this.lockDate
            );
            onReject('You have already made a submission to the assignment.');
            return;
        }
    }
}
