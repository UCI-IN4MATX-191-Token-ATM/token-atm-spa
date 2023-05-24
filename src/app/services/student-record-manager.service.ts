import { Inject, Injectable } from '@angular/core';
import type { ProcessedRequest } from 'app/data/processed-request';
import type { Student } from 'app/data/student';
import { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { compareAsc, format, fromUnixTime, getUnixTime } from 'date-fns';
import { CanvasService } from './canvas.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
    providedIn: 'root'
})
export class StudentRecordManagerService {
    public static PROMPT = 'Please ignore the characters below:\n';

    constructor(@Inject(CanvasService) private canvasService: CanvasService) {}

    private async writeStudentRecordToCanvas(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord
    ): Promise<StudentRecord> {
        const courseId = configuration.course.id,
            studentId = studentRecord.student.id,
            assignmentId = configuration.logAssignmentId;
        const oldCommentId = studentRecord.commentId;
        const newSubmissionComment = await this.canvasService.gradeSubmissionWithPostingComment(
            courseId,
            studentId,
            assignmentId,
            studentRecord.tokenBalance,
            uuidv4()
        );
        studentRecord.commentId = newSubmissionComment.id;
        studentRecord.commentDate = newSubmissionComment.created_at;
        // Avoid duplicate Date signature
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await this.canvasService.modifyComment(
            courseId,
            studentId,
            assignmentId,
            newSubmissionComment.id,
            StudentRecordManagerService.PROMPT + (await configuration.encryptStudentRecord(studentRecord))
        );
        if (oldCommentId != '') {
            await this.canvasService.deleteSubmissionComment(courseId, studentId, assignmentId, oldCommentId);
        }
        return studentRecord;
    }

    public async getStudentRecord(
        configuration: TokenATMConfiguration,
        student: Student,
        tokenBalanceMap?: Map<string, number>
    ): Promise<StudentRecord> {
        const courseId = configuration.course.id,
            studentId = student.id,
            assignmentId = configuration.logAssignmentId;
        const submissionComments = await this.canvasService.getSubmissionComments(courseId, studentId, assignmentId);
        let tokenBalance = 0;
        if (tokenBalanceMap && tokenBalanceMap.has(student.id)) {
            const result = tokenBalanceMap.get(student.id);
            if (result) tokenBalance = result;
        } else {
            tokenBalance = await this.canvasService.getSingleSubmissionGrade(courseId, studentId, assignmentId);
        }
        for (const submissionComment of submissionComments.reverse()) {
            if (!submissionComment.content.startsWith(StudentRecordManagerService.PROMPT)) continue;
            let data;
            try {
                data = (await configuration.decryptStudentRecord(
                    submissionComment.content.split('\n')[1] as string
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                )) as any;
            } catch (err: unknown) {
                await this.canvasService.deleteComment(courseId, studentId, assignmentId, submissionComment.id);
                continue;
            }
            if (
                typeof data['comment_date'] != 'number' ||
                compareAsc(fromUnixTime(data['comment_date']), submissionComment.created_at) != 0
            ) {
                await this.canvasService.deleteComment(courseId, studentId, assignmentId, submissionComment.id);
                continue;
            }
            return new StudentRecord(configuration, student, submissionComment.id, tokenBalance, data);
        }
        let studentRecord = new StudentRecord(configuration, student, '', tokenBalance, {
            comment_date: getUnixTime(new Date()),
            processed_attempt_map: [],
            processed_requests: []
        });
        studentRecord = await this.writeStudentRecordToCanvas(configuration, studentRecord);
        return studentRecord;
    }

    public async logProcessedRequest(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        processedRequest: ProcessedRequest
    ) {
        const oldTokenBalance = studentRecord.tokenBalance;
        studentRecord.logProcessedRequest(processedRequest);
        // generate a new comment
        this.canvasService.postComment(
            configuration.course.id,
            studentRecord.student.id,
            configuration.logAssignmentId,
            `Your request to ${processedRequest.tokenOptionName} has been processed.\nResult: ${
                processedRequest.isApproved ? 'Approved' : 'Rejected'
            }\nSubmitted at: ${format(processedRequest.submitTime, 'MMM dd, yyyy kk:mm:ss')}\nProcessed at: ${format(
                processedRequest.processTime,
                'MMM dd, yyyy kk:mm:ss'
            )}\nToken Balance Change: ${oldTokenBalance} -> ${studentRecord.tokenBalance}${
                processedRequest.message != '' ? `\nMessage: ${processedRequest.message}` : ''
            }`
        );
        await this.writeStudentRecordToCanvas(configuration, studentRecord);
    }
}
