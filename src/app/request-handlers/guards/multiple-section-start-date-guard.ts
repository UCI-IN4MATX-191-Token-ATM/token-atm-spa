import { RequestHandlerGuard } from './request-handler-guard';
import type { MultipleSectionDateMatcher } from 'app/utils/multiple-section-date-matcher';
import type { CanvasService } from 'app/services/canvas.service';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';
import { compareAsc } from 'date-fns';

export class MultipleSectionStartDateGuard extends RequestHandlerGuard {
    constructor(
        private courseId: string,
        private studentId: string,
        private submittedDate: Date,
        private startDate: MultipleSectionDateMatcher,
        private canvasService: CanvasService
    ) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        const matchedStartDate = this.startDate.match(
            await DataConversionHelper.convertAsyncIterableToList(
                await this.canvasService.getStudentSectionEnrollments(this.courseId, this.studentId)
            )
        );
        // Reject message should match message in start-date-guard.ts
        if (compareAsc(this.submittedDate, matchedStartDate) == -1) onReject('Request was submitted too early');
    }
}
