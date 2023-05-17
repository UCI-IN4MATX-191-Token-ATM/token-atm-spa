import { Inject, Injectable } from '@angular/core';
import { Course } from 'app/data/course';
import { QuizSubmission } from 'app/data/quiz-submission';
import { Student } from 'app/data/student';
import { SubmissionComment } from 'app/data/submission-comment';
import { PaginatedResult } from 'app/utils/paginated-result';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { parseISO } from 'date-fns';
import { AxiosService } from './axios.service';
import { User } from 'app/data/user';

type QuizQuestionResponse = {
    id: string;
    answers: {
        id: string;
        text: string;
    }[];
};

@Injectable({
    providedIn: 'root'
})
export class CanvasService {
    #url?: string;
    #accessToken?: string;

    constructor(@Inject(AxiosService) private axiosService: AxiosService) {}

    public hasCredentialConfigured(): boolean {
        return this.#url != undefined && this.#accessToken != undefined;
    }

    public async configureCredential(url: string, accessToken: string): Promise<boolean> {
        this.#url = url;
        this.#accessToken = accessToken;
        // TODO: validate credential
        return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async rawAPIRequest<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        const result = await this.axiosService.request({
            ...config,
            url: this.#url + endpoint,
            headers: {
                ...config?.headers,
                Accept: 'application/json+canvas-string-ids',
                Authorization: 'Bearer ' + this.#accessToken
            }
        });
        return result;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async apiRequest<T = any>(endpoint: string, config?: AxiosRequestConfig | undefined): Promise<T> {
        return (await this.rawAPIRequest<T>(endpoint, config)).data;
    }

    private async paginatedRequestHandler<T>(url: string): Promise<AxiosResponse<T>> {
        return await this.axiosService.request({
            url: url,
            headers: {
                Accept: 'application/json+canvas-string-ids',
                Authorization: 'Bearer ' + this.#accessToken
            }
        });
    }

    public async getCourses(
        enrollmentType: 'teacher' | 'ta' = 'teacher',
        enrollmentState: 'active' | 'invited_or_pending' = 'active'
    ): Promise<PaginatedResult<Course>> {
        const response = await this.rawAPIRequest('/api/v1/courses', {
            params: {
                per_page: 100,
                enrollment_type: enrollmentType,
                enrollment_state: enrollmentState,
                include: ['term']
            }
        });
        return new PaginatedResult(
            response,
            async (url: string) => await this.paginatedRequestHandler(url),
            (data) => {
                let processedData = data;
                if (Object.hasOwn(data, 'meta')) {
                    const primaryCollectionKey = data['meta']['primaryCollection'];
                    const termInfoMap = new Map<string, unknown>();
                    const termCollectionKey = Object.keys(data).filter(
                        (key) => !['meta', primaryCollectionKey].includes(key)
                    )[0];
                    if (termCollectionKey) {
                        for (const term of data[termCollectionKey]) {
                            if (!term['id']) continue;
                            termInfoMap.set(term['id'], term);
                        }
                    }
                    processedData = data[primaryCollectionKey];
                    for (const course of processedData) {
                        course.term = termInfoMap.get(course['enrollment_term_id']);
                    }
                }
                return processedData.map((entry: unknown) => new Course(entry));
            }
        );
    }

    public async getPageContentById(courseId: string, pageId: string): Promise<string> {
        const response = await this.rawAPIRequest(`/api/v1/courses/${courseId}/pages/${pageId}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const content = (response.data as any).body;
        if (!content) throw new Error('Page fetch error');
        return content;
    }

    public async getUserInformation(userId: string): Promise<User> {
        const data = await this.apiRequest(`/api/v1/users/${userId}`);
        return new User(data);
    }
    public async getPageContentByName(courseId: string, pageName: string): Promise<string> {
        const response = await this.rawAPIRequest(`/api/v1/courses/${courseId}/pages`, {
            params: {
                search_term: pageName
            }
        });
        if (!Array.isArray(response.data)) throw new Error('Page fetch error');
        if (response.data.length == 0) throw new Error('Page not found'); // TODO: redirect to creation
        if (response.data.length > 1) throw new Error('Multiple pages found'); // TODO: redirect to duplication handling
        const content = await this.getPageContentById(courseId, response.data[0]['page_id']);
        return content;
    }

    public async getQuizSubmissions(courseId: string, quizId: string): Promise<PaginatedResult<QuizSubmission>> {
        const response = await this.rawAPIRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}/submissions`, {
            params: {
                per_page: 100
            }
        });
        return new PaginatedResult(
            response,
            async (url: string) => await this.paginatedRequestHandler(url),
            (data) => data.quiz_submissions.map((entry: unknown) => new QuizSubmission(entry))
        );
    }

    public async getSubmissionComments(
        courseId: string,
        studentId: string,
        assignmentId: string
    ): Promise<SubmissionComment[]> {
        const data = await this.apiRequest(
            `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`,
            {
                params: {
                    include: ['submission_comments']
                }
            }
        );
        return data.submission_comments.map((entry: unknown) => new SubmissionComment(entry));
    }

    public async getSingleSubmissionGrade(
        courseId: string,
        studentId: string,
        assignmentId: string,
        defaultValue = 0
    ): Promise<number> {
        const data = await this.apiRequest(
            `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`
        );
        return data.score ?? defaultValue;
    }

    public async deleteSubmissionComment(
        courseId: string,
        studentId: string,
        assignmentId: string,
        commentId: string
    ): Promise<void> {
        await this.apiRequest(
            `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}/comments/${commentId}`,
            {
                method: 'delete'
            }
        );
    }

    public async gradeSubmissionWithPostingComment(
        courseId: string,
        studentId: string,
        assignmentId: string,
        score: number,
        newComment: string
    ): Promise<string> {
        const data = await this.apiRequest(
            `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`,
            {
                method: 'put',
                data: {
                    comment: {
                        text_comment: newComment
                    },
                    submission: {
                        posted_grade: score.toString()
                    }
                }
            }
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const submissionComments = data.submission_comments as any[];
        return submissionComments[submissionComments.length - 1].id ?? '';
    }

    public async getAssignmentIdByQuizId(courseId: string, quizId: string): Promise<string> {
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}`);
        return data.assignment_id;
    }

    public async getQuizSubmissionAttempt(
        courseId: string,
        quizId: string,
        quizSubmissionId: string,
        studentId: string,
        quizSubmissionAttempt = 1,
        { assignmentId = undefined }: { assignmentId?: string } = {}
    ): Promise<[Date, string[]]> {
        if (!assignmentId) assignmentId = await this.getAssignmentIdByQuizId(courseId, quizId);
        const questions = new PaginatedResult<QuizQuestionResponse>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}/questions`, {
                params: {
                    per_page: 100,
                    quiz_submission_id: quizSubmissionId,
                    quiz_submission_attempt: quizSubmissionAttempt
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return data.map((entry: any) => {
                    const result: QuizQuestionResponse = {
                        id: entry.id,
                        answers: []
                    };
                    for (const option of entry.answers) {
                        result.answers.push({
                            id: option.id,
                            text: option.text
                        });
                    }
                    return result;
                });
            }
        );
        const questionOptions = new Map<string, Map<string, string>>();
        for await (const question of questions) {
            if (!questionOptions.has(question.id)) questionOptions.set(question.id, new Map<string, string>());
            for (const option of question.answers) {
                questionOptions.get(question.id)?.set(option.id, option.text);
            }
        }
        const pastSubmissions = (
            await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`, {
                params: {
                    include: ['submission_history']
                }
            })
        ).submission_history;
        const questionAnswers = new Map<string, string>();
        let submissionDate = new Date();
        for (const submission of pastSubmissions) {
            if (submission.attempt != quizSubmissionAttempt) continue;
            submissionDate = parseISO(submission.submitted_at);
            const submissionData = submission.submission_data;
            for (const answer of submissionData) {
                const textAnswer = questionOptions.get(answer.question_id)?.get(answer.answer_id);
                if (!textAnswer) continue;
                questionAnswers.set(answer.question_id, textAnswer);
            }
            break;
        }
        const result = [];
        for await (const question of questions) {
            result.push(questionAnswers.get(question.id) ?? '');
        }
        return [submissionDate, result];
    }

    public async getCourseStudentEnrollments(courseId: string): Promise<PaginatedResult<Student>> {
        return new PaginatedResult(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/enrollments`, {
                params: {
                    per_page: 100,
                    type: 'StudentEnrollment'
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data: any) => data.map((entry: any) => new Student(entry.user))
        );
    }
}
