import { Inject, Injectable } from '@angular/core';
import { RequestHandler } from '../request-handlers';
import type { SpendForAdditionalPointsTokenOption } from 'app/token-options/spend-for-additional-points/spend-for-additional-points-token-option';
import { CanvasService } from 'app/services/canvas.service';
import { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { RequestHandlerGuardExecutor } from '../request-handler-guards/request-handler-guard-executor';
import { addPercentOrPointsToCanvasGrade } from 'app/utils/canvas-grading';
import { MultipleRequestsGuard } from '../request-handler-guards/multiple-requests-guard';
import { ExcludeTokenOptionsGuard } from '../request-handler-guards/exclude-token-options-guard';
import { SufficientTokenBalanceGuard } from '../request-handler-guards/sufficient-token-balance-guard';
import type { TokenATMRequest } from 'app/token-options/token-atm-request';

type SpendForAdditionalPointsRequest = TokenATMRequest<SpendForAdditionalPointsTokenOption>;

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
        const guardExecutor = new RequestHandlerGuardExecutor([
            new MultipleRequestsGuard(request.tokenOption, studentRecord.processedRequests),
            new ExcludeTokenOptionsGuard(request.tokenOption.excludeTokenOptionIds, studentRecord.processedRequests),
            new SufficientTokenBalanceGuard(studentRecord.tokenBalance, request.tokenOption.tokenBalanceChange)
        ]);
        await guardExecutor.check();
        if (!guardExecutor.isRejected) {
            const { gradingType, pointsPossible } = await this.canvasService.getAssignmentGradingTypeAndPointsPossible(
                configuration.course.id,
                request.tokenOption.assignmentId
            );
            if (gradingType !== 'points' && gradingType !== 'percent') {
                throw new Error(
                    `${request.tokenOption.assignmentName} doesn’t display its Grade as Points or as a Percent, and so its score cannot be added to.`
                );
            }
            if (
                !(await this.canvasService.isAssignmentPublished(
                    configuration.course.id,
                    request.tokenOption.assignmentId
                ))
            ) {
                throw new Error(
                    `${request.tokenOption.assignmentName} must be published for its score to be added to.`
                );
            }
            const addText = request.tokenOption.additionalScore;
            const { grade, score, gradeMatchesCurrentSubmission } = await this.canvasService.getSubmissionGradeAndScore(
                configuration.course.id,
                request.tokenOption.assignmentId,
                studentRecord.student.id
            );
            const totalPointsPossible = request.tokenOption.changeMaxPossiblePoints
                ? await this.canvasService.getTotalPointsPossibleInAnAssignmentGroup(
                      configuration.course.id,
                      request.tokenOption.changeMaxPossiblePoints[1].groupId
                  )
                : undefined;
            // TODO: Handle / find the actual current Submission, or add to all submissions
            if (!gradeMatchesCurrentSubmission) {
                throw new Error('Was about to add to an out-of-date Canvas submission score.');
            }
            const { postedGrade: newPostedGrade, updateMessage } = addPercentOrPointsToCanvasGrade(
                addText,
                { gradeType: gradingType, grade, score, pointsPossible },
                totalPointsPossible
            );
            const assignmentComment = `Request for ${request.tokenOption.name} was approved.\n` + updateMessage;
            await this.canvasService.postSubmissionGradeWithComment(
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
            guardExecutor.message ?? 'See Assignment comment for more info',
            request.tokenOption.group.id
        );
    }
    public get type(): string {
        return 'spend-for-additional-points';
    }
}
