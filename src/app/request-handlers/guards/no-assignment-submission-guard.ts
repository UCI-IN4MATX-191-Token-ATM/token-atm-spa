import type { CanvasService } from 'app/services/canvas.service';
import { RequestHandlerGuard } from './request-handler-guard';

export class NoAssignmentSubmissionGuard extends RequestHandlerGuard {
    constructor(
        private courseId: string,
        private assignmentId: string,
        private studentId: string,
        private overrideTitlePrefix: string,
        private lockDate: Date,
        private canvasService: CanvasService
    ) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        await this.canvasService.deleteAssignmentOverrideForStudent(this.courseId, this.assignmentId, this.studentId);
        const submission = await this.canvasService.getAssignmentSubmission(
            this.courseId,
            this.assignmentId,
            this.studentId
        );
        if (submission.workflowState != 'unsubmitted') {
            await this.canvasService.createAssignmentOverrideForStudent(
                this.courseId,
                this.assignmentId,
                this.studentId,
                this.overrideTitlePrefix,
                this.lockDate
            );
            onReject('You have already made a submission to the assignment.');
            return;
        }
    }
}
