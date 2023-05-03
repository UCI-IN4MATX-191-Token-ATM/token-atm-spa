import { Inject, Injectable } from '@angular/core';
import type { ProcessedRequest } from 'app/data/processed-request';
import type { Student } from 'app/data/student';
import { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { CanvasService } from './canvas.service';

@Injectable({
    providedIn: 'root'
})
export class StudentRecordManagerService {
    constructor(@Inject(CanvasService) private canvasService: CanvasService) {}

    public async getStudentRecord(
        configuration: TokenATMConfiguration,
        student: Student,
        tokenBalanceMap?: Map<string, number>
    ): Promise<StudentRecord> {
        const submissionComments = await this.canvasService.getSubmissionComments(
            configuration.course.id,
            student.id,
            configuration.logAssignmentId
        );
        let tokenBalance = 0;
        if (tokenBalanceMap && tokenBalanceMap.has(student.id)) {
            const result = tokenBalanceMap.get(student.id);
            if (result) tokenBalance = result;
        } else {
            tokenBalance = await this.canvasService.getSingleSubmissionGrade(
                configuration.course.id,
                student.id,
                configuration.logAssignmentId
            );
        }
        // TODO: initialize the student record if not found
        // TODO: verify the authencity of the comment
        return submissionComments.length == 0
            ? new StudentRecord(configuration, student, '', tokenBalance, {
                  processed_attempt_map: [],
                  processed_requests: []
              })
            : new StudentRecord(
                  configuration,
                  student,
                  submissionComments[submissionComments.length - 1]?.id ?? '',
                  tokenBalance,
                  JSON.parse(
                      submissionComments[submissionComments.length - 1]?.content ??
                          JSON.stringify({
                              processed_attempt_map: [],
                              processed_requests: []
                          })
                  )
              );
    }

    public async logProcessedRequest(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        processedRequest: ProcessedRequest
    ) {
        if (studentRecord.commentId != '')
            await this.canvasService.deleteSubmissionComment(
                configuration.course.id,
                studentRecord.student.id,
                configuration.logAssignmentId,
                studentRecord.commentId
            );
        studentRecord.logProcessedRequest(processedRequest);
        const newCommentId = await this.canvasService.gradeSubmissionWithPostingComment(
            configuration.course.id,
            studentRecord.student.id,
            configuration.logAssignmentId,
            studentRecord.tokenBalance,
            JSON.stringify(studentRecord)
        );
        studentRecord.commentId = newCommentId;
    }
}
