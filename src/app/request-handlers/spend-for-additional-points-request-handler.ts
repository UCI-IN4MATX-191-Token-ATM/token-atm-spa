import { Inject, Injectable } from '@angular/core';
import { RequestHandler } from './request-handlers';
import type { SpendForAdditionalPointsTokenOption } from 'app/token-options/spend-for-additional-points-token-option';
import type { SpendForAdditionalPointsRequest } from 'app/requests/spend-for-additional-points-request';
import { CanvasService } from 'app/services/canvas.service';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { RequestHandlerGuardExecutor } from './guards/request-handler-guard-executor';
import {
    addPercentToPointsOrPercentType,
    addPointsToPercentOrPointsType,
    parseCanvasPercentsAndPoints
} from 'app/utils/canvas-grading';
import { MultipleRequestsGuard } from './guards/multiple-requests-guard';
import { ExcludeTokenOptionsGuard } from './guards/exclude-token-options-guard';
import { SufficientTokenBalanceGuard } from './guards/sufficient-token-balance-guard';

@Injectable()
export class SpendForAdditionalPointsRequestHandler extends RequestHandler<
    SpendForAdditionalPointsTokenOption,
    SpendForAdditionalPointsRequest
> {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {
        super();
    }
    public async handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: SpendForAdditionalPointsRequest
    ): Promise<ProcessedRequest> {
        const { gradingType, pointsPossible } = await this.canvasService.getAssignmentGradingTypeAndPointsPossible(
            configuration.course.id,
            request.tokenOption.assignmentId
        );
        if (gradingType === 'points' || gradingType === 'percent') {
            const guardExecutor = new RequestHandlerGuardExecutor([
                new MultipleRequestsGuard(request.tokenOption, studentRecord.processedRequests),
                new ExcludeTokenOptionsGuard(
                    request.tokenOption.excludeTokenOptionIds,
                    studentRecord.processedRequests
                ),
                new SufficientTokenBalanceGuard(studentRecord.tokenBalance, request.tokenOption.tokenBalanceChange)
            ]);
            await guardExecutor.check();
            if (!guardExecutor.isRejected) {
                const isAddingPercent = true; // TODO: Update to use input form
                let toAdd = parseCanvasPercentsAndPoints('0'); // TODO: Update to use input form
                toAdd = request.tokenOption.gradeThreshold;
                const addScoreFunc = isAddingPercent ? addPercentToPointsOrPercentType : addPointsToPercentOrPointsType;
                const { grade, score, gradeMatchesCurrentSubmission } =
                    await this.canvasService.getSubmissionGradeAndScore(
                        configuration.course.id,
                        request.tokenOption.assignmentId,
                        studentRecord.student.id
                    );
                if (!gradeMatchesCurrentSubmission) {
                    throw new Error('Was about to add points to an out-of-date assignment score.');
                }
                const current = gradingType === 'points' ? score.toString() : grade;
                const newPostedGrade = addScoreFunc(toAdd, current, pointsPossible);
                const toAddStr = addScoreFunc(toAdd, isAddingPercent ? '0%' : '0', pointsPossible); // TODO: use input text
                const assignmentComment = `Request for ${request.tokenOption.name} was approved.\nChange: ${current} => ${newPostedGrade}\nAdded ${toAddStr} to ${current} of ${pointsPossible} points.`;
                this.canvasService.postSubmissionGradeWithComment(
                    configuration.course.id,
                    studentRecord.student.id,
                    request.tokenOption.assignmentId,
                    newPostedGrade,
                    assignmentComment
                );
            }
            return new ProcessedRequest(
                configuration,
                request.tokenOption.id,
                request.tokenOption.name,
                request.student,
                !guardExecutor.isRejected,
                request.submittedTime,
                new Date(),
                guardExecutor.isRejected ? 0 : request.tokenOption.tokenBalanceChange,
                guardExecutor.message ?? '',
                request.tokenOption.group.id
            );
        } else {
            throw new Error(
                `${request.tokenOption.assignmentName} doesn’t display its Grade as Points or a Percent, and so its score cannot be added to.`
            );
        }
    }
    public get type(): string {
        return 'spend-for-additional-points';
    }
}
