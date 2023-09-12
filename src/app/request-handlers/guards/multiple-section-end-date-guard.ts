import { compareDesc } from 'date-fns';
import { RequestHandlerGuard } from './request-handler-guard';
import type { MultipleSectionDateMatcher } from 'app/utils/multiple-section-date-matcher';
import type { CanvasService } from 'app/services/canvas.service';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';

export class MultipleSectionEndDateGuard extends RequestHandlerGuard {
    constructor(
        private courseId: string,
        private studentId: string,
        private submittedDate: Date,
        private endDate: MultipleSectionDateMatcher,
        private canvasService: CanvasService
    ) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        const matchedEndDate = this.endDate.match(
            await DataConversionHelper.convertAsyncIterableToList(
                await this.canvasService.getStudentSectionEnrollments(this.courseId, this.studentId)
            )
        );
        // Reject message should match message in end-date-guard.ts
        if (compareDesc(this.submittedDate, matchedEndDate) == -1) onReject('Request was submitted too late');
    }
}
