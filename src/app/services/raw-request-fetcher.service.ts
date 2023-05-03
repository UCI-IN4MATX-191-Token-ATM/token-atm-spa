import { Inject, Injectable } from '@angular/core';
import { QuizSubmissionDetail } from 'app/data/quiz-submission-detail';
import type { Student } from 'app/data/student';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { CanvasService } from './canvas.service';

@Injectable({
    providedIn: 'root'
})
export class RawRequestFetcherService {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {}

    public async fetchRawRequest(
        configuration: TokenATMConfiguration,
        tokenOptionGroup: TokenOptionGroup,
        student: Student,
        quizSubmissionId: string,
        curAttempt: number,
        assignmentId?: string
    ): Promise<QuizSubmissionDetail> {
        const [submittedAt, answers] = await this.canvasService.getQuizSubmissionAttempt(
            configuration.course.id,
            tokenOptionGroup.quizId,
            quizSubmissionId,
            student.id,
            curAttempt,
            { assignmentId: assignmentId }
        );
        return new QuizSubmissionDetail(student, submittedAt, curAttempt, answers);
    }
}
