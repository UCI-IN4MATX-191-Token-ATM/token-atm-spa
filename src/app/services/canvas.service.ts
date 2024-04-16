import { Inject, Injectable } from '@angular/core';
import { Course } from 'app/data/course';
import { ModuleItemInfo } from 'app/data/module-item-info';
import { QuizSubmission } from 'app/data/quiz-submission';
import { Student } from 'app/data/student';
import { SubmissionComment } from 'app/data/submission-comment';
import type { PaginatedResult } from 'app/utils/pagination/paginated-result';
import { CanvasRESTPaginatedResult } from 'app/utils/pagination/canvas-rest-paginated-result';
import { PaginatedView } from 'app/utils/paginated-view';
import type { AxiosRequestConfig } from 'axios';
import { compareAsc, compareDesc, formatISO, isEqual, parseISO } from 'date-fns';
import { AxiosService, IPCCompatibleAxiosResponse, isNetworkOrServerError } from './axios.service';
import { User } from 'app/data/user';
import type { QuizQuestion } from 'app/quiz-questions/quiz-question';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';
import { Quiz } from 'app/data/quiz';
import { AssignmentOverride, AssignmentOverrideDef } from 'app/data/assignment-override';
import { CanvasModule } from 'app/data/canvas-module';
import { Assignment, AssignmentDef } from 'app/data/assignment';
import { AssignmentSubmission } from 'app/data/assignment-submission';
import { Section } from 'app/data/section';
import { unwrapValidation } from 'app/utils/validation-unwrapper';
import type { CanvasCredential } from 'app/data/token-atm-credentials';
import { ExponentialBackoffExecutorService } from './exponential-backoff-executor.service';
import { collectPointsPossible, type CanvasGradingType } from 'app/utils/canvas-grading';
import { AssignmentGroupDef, type AssignmentGroup } from 'app/data/assignment-group';

type QuizQuestionResponse = {
    id: string;
    answers: {
        id: string;
        text: string;
    }[];
};

type StudentGradeInfo = {
    user_id: string;
    score: number;
};

@Injectable({
    providedIn: 'root'
})
export class CanvasService {
    private static ASSIGNMENT_OVERRIDE_MAX_SIZE = 35;
    private static RETRY_MSG = 'Fail to communicate with Canvas. Retrying...';

    #url?: string;
    #accessToken?: string;

    constructor(
        @Inject(AxiosService) private axiosService: AxiosService,
        @Inject(ExponentialBackoffExecutorService)
        private exponentialBackoffExecutorService: ExponentialBackoffExecutorService
    ) {}

    public hasCredentialConfigured(): boolean {
        return this.#url != undefined && this.#accessToken != undefined;
    }

    public async configureCredential({
        canvasURL: url,
        canvasAccessToken: accessToken
    }: CanvasCredential): Promise<unknown | undefined> {
        this.#url = url;
        this.#accessToken = accessToken;
        try {
            await this.getUserInformation('self');
        } catch (err: unknown) {
            return err;
        }
        return undefined;
    }

    public clearCredential() {
        this.#url = undefined;
        this.#accessToken = undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async rawAPIRequest<T = any>(
        endpoint: string,
        config?: AxiosRequestConfig
    ): Promise<IPCCompatibleAxiosResponse<T>> {
        const executor = async () => {
            if (!this.hasCredentialConfigured()) throw new Error('Canvas credential is not configured!');
            return await this.axiosService.request<T>({
                ...config,
                url: this.#url + endpoint,
                headers: {
                    ...config?.headers,
                    Accept: 'application/json+canvas-string-ids',
                    Authorization: 'Bearer ' + this.#accessToken
                }
            });
        };
        return await this.exponentialBackoffExecutorService.execute(
            executor,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async (_, err: any | undefined) => !isNetworkOrServerError(err),
            CanvasService.RETRY_MSG
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async apiRequest<T = any>(endpoint: string, config?: AxiosRequestConfig | undefined): Promise<T> {
        return (await this.rawAPIRequest<T>(endpoint, config)).data;
    }

    private async paginatedRequestHandler<T>(url: string): Promise<IPCCompatibleAxiosResponse<T>> {
        const executor = async () => {
            if (!this.hasCredentialConfigured()) throw new Error('Canvas credential is not configured!');
            return await this.axiosService.request<T>({
                url: url,
                headers: {
                    Accept: 'application/json+canvas-string-ids',
                    Authorization: 'Bearer ' + this.#accessToken
                }
            });
        };
        return await this.exponentialBackoffExecutorService.execute(
            executor,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async (_, err: any | undefined) => !isNetworkOrServerError(err),
            CanvasService.RETRY_MSG
        );
    }

    private async safeGuardForAssignment(courseId: string, assignmentId: string): Promise<void> {
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}`);
        if (!data.name.includes('Token ATM') || data.id != assignmentId)
            throw new Error('Safe guard for assignment is violated!');
    }

    private async safeGuardForQuiz(courseId: string, quizId: string): Promise<void> {
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}`);
        if (!data.title.includes('Token ATM') || data.id != quizId) throw new Error('Safe guard for quiz is violated!');
    }

    private async safeGuardForAssignmentGroup(courseId: string, assignmentGroupId: string): Promise<void> {
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/assignment_groups/${assignmentGroupId}`);
        if (!data.name.includes('Token ATM') || data.id != assignmentGroupId)
            throw new Error('Safe guard for assignment group is violated!');
    }

    private async safeGuardForModule(courseId: string, moduleId: string): Promise<void> {
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/modules/${moduleId}`);
        if (!data.name.includes('Token ATM') || data.id != moduleId)
            throw new Error('Safe guard for module is violated!');
    }

    private async safeGuardForPage(courseId: string, pageId: string): Promise<void> {
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/pages/${pageId}`);
        if (!data.title.includes('Token ATM') || data.page_id != pageId)
            throw new Error('Safe guard for page is violated!');
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
        return new CanvasRESTPaginatedResult(
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
                return processedData.map((entry: unknown) => Course.deserialize(entry));
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
        return User.deserialize(data);
    }

    public async deletePage(courseId: string, pageId: string): Promise<void> {
        await this.safeGuardForPage(courseId, pageId);
        await this.apiRequest(`/api/v1/courses/${courseId}/pages/${pageId}`, {
            method: 'delete'
        });
    }

    public async createPage(
        courseId: string,
        pageTitle: string,
        pageContent: string,
        editingRoles = 'teachers',
        notifyUpdate = false,
        published = false
    ): Promise<string> {
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/pages`, {
            method: 'post',
            data: {
                wiki_page: {
                    title: pageTitle,
                    body: pageContent,
                    editing_roles: editingRoles,
                    notify_of_update: notifyUpdate,
                    published: published
                }
            }
        });
        return data.page_id;
    }

    public async modifyPage(
        courseId: string,
        pageId: string,
        pageContent: string,
        notifyUpdate = false,
        published = false
    ): Promise<string> {
        await this.safeGuardForPage(courseId, pageId);
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/pages/${pageId}`, {
            method: 'put',
            data: {
                wiki_page: {
                    body: pageContent,
                    notify_of_update: notifyUpdate,
                    published: published
                }
            }
        });
        return data.page_id;
    }

    public async getPageIdByName(courseId: string, pageName: string): Promise<string> {
        let pageIds = await DataConversionHelper.convertAsyncIterableToList<[string, string]>(
            new CanvasRESTPaginatedResult<[string, string]>(
                await this.rawAPIRequest(`/api/v1/courses/${courseId}/pages`, {
                    params: {
                        search_term: pageName,
                        per_page: 100
                    }
                }),
                async (url: string) => await this.paginatedRequestHandler(url),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (data) => data.map((entry: any) => [entry.page_id, entry.title])
            )
        );
        pageIds = pageIds.filter((entry) => entry[1] == pageName);
        if (pageIds.length == 0) throw new Error('Page not found'); // TODO: redirect to creation
        if (pageIds.length > 1) throw new Error('Multiple pages found'); // TODO: redirect to duplication handling
        return pageIds[0]?.[0] as string;
    }

    public async getPageContentByName(courseId: string, pageName: string): Promise<string> {
        const content = await this.getPageContentById(courseId, await this.getPageIdByName(courseId, pageName));
        return content;
    }

    public async createOrModifyPageByName(courseId: string, pageTitle: string, pageContent: string): Promise<string> {
        try {
            const pageId = await this.getPageIdByName(courseId, pageTitle);
            return await this.modifyPage(courseId, pageId, pageContent);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            if (err.message == 'Page not found') return await this.createPage(courseId, pageTitle, pageContent);
            throw err;
        }
    }

    public async getQuizSubmissions(courseId: string, quizId: string): Promise<PaginatedResult<QuizSubmission>> {
        const response = await this.rawAPIRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}/submissions`, {
            params: {
                per_page: 100
            }
        });
        return new CanvasRESTPaginatedResult(
            response,
            async (url: string) => await this.paginatedRequestHandler(url),
            (data) => data.quiz_submissions.map((entry: unknown) => QuizSubmission.deserialize(entry))
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
        return data.submission_comments.map((entry: unknown) => SubmissionComment.deserialize(entry));
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
        await this.safeGuardForAssignment(courseId, assignmentId);
        await this.apiRequest(
            `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}/comments/${commentId}`,
            {
                method: 'delete'
            }
        );
    }

    public async postComment(
        courseId: string,
        studentId: string,
        assignmentId: string,
        comment: string
    ): Promise<SubmissionComment> {
        await this.safeGuardForAssignment(courseId, assignmentId);
        const data = await this.apiRequest(
            `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`,
            {
                method: 'put',
                data: {
                    comment: {
                        text_comment: comment
                    }
                }
            }
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const submissionComments = data.submission_comments as any[];
        for (let i = submissionComments.length - 1; i >= 0; i--) {
            let result;
            try {
                result = SubmissionComment.deserialize(submissionComments[i]);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                continue;
            }
            if (result.content != comment) continue;
            return result;
        }
        throw new Error('Comment creation failed');
    }

    public async deleteComment(
        courseId: string,
        studentId: string,
        assignmentId: string,
        commentId: string
    ): Promise<void> {
        await this.safeGuardForAssignment(courseId, assignmentId);
        await this.apiRequest(
            `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}/comments/${commentId}`,
            {
                method: 'delete'
            }
        );
    }

    public async modifyComment(
        courseId: string,
        studentId: string,
        assignmentId: string,
        commentId: string,
        comment: string
    ): Promise<SubmissionComment> {
        await this.safeGuardForAssignment(courseId, assignmentId);
        const data = await this.apiRequest(
            `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}/comments/${commentId}`,
            {
                method: 'put',
                data: {
                    comment: comment
                }
            }
        );
        return SubmissionComment.deserialize(data);
    }

    public async gradeSubmission(
        courseId: string,
        studentId: string,
        assignmentId: string,
        score: number
    ): Promise<void> {
        await this.safeGuardForAssignment(courseId, assignmentId);
        await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`, {
            method: 'put',
            data: {
                submission: {
                    posted_grade: score.toString()
                }
            }
        });
    }

    /**
     * Warning! Has no internal guards to protect assignments/submissions.
     */
    public async gradeSubmissionWithPercentage(
        courseId: string,
        studentId: string,
        assignmentId: string,
        scorePercentage: number
    ): Promise<void> {
        await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`, {
            method: 'put',
            data: {
                submission: {
                    posted_grade: (scorePercentage * 100).toFixed(2) + '%'
                }
            }
        });
    }

    /**
     * Warning! Has no internal guards to protect assignments/submissions.
     */
    public async postSubmissionGradeWithComment(
        courseId: string,
        studentId: string,
        assignmentId: string,
        postedGrade: string,
        newComment: string
    ): Promise<void> {
        await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`, {
            method: 'put',
            data: {
                comment: {
                    text_comment: newComment
                },
                submission: {
                    posted_grade: postedGrade
                }
            }
        });
    }

    public async gradeSubmissionWithPostingComment(
        courseId: string,
        studentId: string,
        assignmentId: string,
        score: number,
        newComment: string
    ): Promise<SubmissionComment> {
        await this.safeGuardForAssignment(courseId, assignmentId);
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
        for (let i = submissionComments.length - 1; i >= 0; i--) {
            let result;
            try {
                result = SubmissionComment.deserialize(submissionComments[i]);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                continue;
            }
            if (result.content != newComment) continue;
            return result;
        }
        throw new Error('Comment creation failed');
    }

    public async getAssignments(courseId: string): Promise<PaginatedResult<Assignment>> {
        return new CanvasRESTPaginatedResult<Assignment>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/assignments`, {
                params: {
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            (data: unknown[]) => data.map((entry) => unwrapValidation(AssignmentDef.decode(entry)))
        );
    }

    public async getAssignment(courseId: string, assignmentId: string): Promise<Assignment> {
        return unwrapValidation(
            AssignmentDef.decode(
                await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}`, {
                    params: {
                        override_assignment_dates: false
                    }
                })
            )
        );
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
    ): Promise<[Date, string[]] | undefined> {
        if (!assignmentId) assignmentId = await this.getAssignmentIdByQuizId(courseId, quizId);
        const pastSubmissions = (
            await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`, {
                params: {
                    include: ['submission_history']
                }
            })
        ).submission_history;
        let curSubmission = undefined;
        for (const submission of pastSubmissions) {
            if (submission.attempt == quizSubmissionAttempt) {
                curSubmission = submission;
                break;
            }
        }
        if (!curSubmission) return undefined;
        const questions = new CanvasRESTPaginatedResult<QuizQuestionResponse>(
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
        const questionAnswers = new Map<string, string>();
        const submissionDate = parseISO(curSubmission.submitted_at);
        const submissionData = curSubmission.submission_data;
        for (const answer of submissionData) {
            if (answer.answer_id == undefined) continue;
            const textAnswer = questionOptions.get(answer.question_id)?.get(answer.answer_id);
            if (!textAnswer) continue;
            questionAnswers.set(answer.question_id, textAnswer);
        }
        const result = [];
        for await (const question of questions) {
            result.push(questionAnswers.get(question.id) ?? '');
        }
        return [submissionDate, result];
    }

    public async getCourseStudentEnrollments(courseId: string): Promise<PaginatedResult<Student>> {
        return new CanvasRESTPaginatedResult<Student>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/users`, {
                params: {
                    enrollment_type: ['student'],
                    enrollment_state: ['active'],
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data: any) => data.map((entry: any) => Student.deserialize(entry))
        );
    }

    public async getModuleScore(courseId: string, moduleId: string, studentId: string): Promise<[number, number]> {
        let obtainedPoints = 0,
            totalPoints = 0;
        const moduleItems = new CanvasRESTPaginatedResult<ModuleItemInfo>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/modules/${moduleId}/items`, {
                params: {
                    include: ['content_details'],
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            (data: unknown[]) => {
                return data.map((entry: unknown) => ModuleItemInfo.deserialize(entry));
            }
        );
        for await (const moduleItem of moduleItems) {
            if (!moduleItem.contentId) continue;
            totalPoints += moduleItem.pointsPossible;
            switch (moduleItem.type) {
                case 'Assignment': {
                    obtainedPoints += await this.getSingleSubmissionGrade(courseId, studentId, moduleItem.contentId, 0);
                    break;
                }
                case 'Quiz': {
                    obtainedPoints += await this.getSingleSubmissionGrade(
                        courseId,
                        studentId,
                        await this.getAssignmentIdByQuizId(courseId, moduleItem.contentId),
                        0
                    );
                    break;
                }
            }
        }
        return [obtainedPoints, totalPoints];
    }
    public async getCourseStudents(
        courseId: string,
        dataPerPage = 50,
        searchTerm?: string
    ): Promise<PaginatedView<Student>> {
        return new PaginatedView(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/users`, {
                params: {
                    enrollment_type: ['student'],
                    enrollment_state: ['active'],
                    per_page: dataPerPage,
                    search_term: searchTerm
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data: any) => data.map((entry: any) => Student.deserialize(entry))
        );
    }

    public async getStudentsGrades(
        courseId: string,
        assignmentId: string,
        studentIds: string[]
    ): Promise<Map<string, number>> {
        // https://canvas.instructure.com/doc/api/submissions.html#method.submissions_api.for_students
        const result = new CanvasRESTPaginatedResult<StudentGradeInfo>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/students/submissions`, {
                params: {
                    student_ids: studentIds,
                    assignment_ids: [assignmentId],
                    enrollment_state: 'active',
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data: any) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.map((entry: any) => {
                    return {
                        user_id: entry['user_id'],
                        score: entry['score'] ?? 0
                    };
                })
        );
        const grades = new Map<string, number>();
        for await (const gradeInfo of result) {
            grades.set(gradeInfo.user_id, gradeInfo.score);
        }
        return grades;
    }

    public async createAssignment(
        courseId: string,
        assignmentGroupId: string,
        assignmentName: string,
        description = ''
    ): Promise<string> {
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/assignments`, {
            method: 'post',
            data: {
                assignment: {
                    name: assignmentName,
                    submission_types: ['none'],
                    notify_of_update: false,
                    points_possible: 0,
                    description: description,
                    assignment_group_id: assignmentGroupId,
                    published: true
                }
            }
        });
        return data.id;
    }

    public async deleteAssignment(courseId: string, assignmentId: string): Promise<void> {
        await this.safeGuardForAssignment(courseId, assignmentId);
        await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}`, {
            method: 'delete'
        });
    }

    public async createModule(courseId: string, moduleName: string): Promise<string> {
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/modules`, {
            method: 'post',
            data: {
                module: {
                    name: moduleName
                }
            }
        });
        return data.id;
    }

    public async publishModule(courseId: string, moduleId: string): Promise<string> {
        await this.safeGuardForModule(courseId, moduleId);
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/modules/${moduleId}`, {
            method: 'put',
            data: {
                module: {
                    published: true
                }
            }
        });
        return data.id;
    }

    public async deleteModule(courseId: string, moduleId: string, deleteAllModuleItems = false): Promise<void> {
        await this.safeGuardForModule(courseId, moduleId);
        if (deleteAllModuleItems) {
            const moduleItems = new CanvasRESTPaginatedResult<ModuleItemInfo>(
                await this.rawAPIRequest(`/api/v1/courses/${courseId}/modules/${moduleId}/items`, {
                    params: {
                        include: ['content_details'],
                        per_page: 100
                    }
                }),
                async (url: string) => await this.paginatedRequestHandler(url),
                (data: unknown[]) => {
                    return data.map((entry: unknown) => ModuleItemInfo.deserialize(entry));
                }
            );
            for await (const moduleItem of moduleItems) {
                if (!moduleItem.contentId) continue;
                switch (moduleItem.type) {
                    case 'Assignment': {
                        await this.deleteAssignment(courseId, moduleItem.contentId);
                        break;
                    }
                    case 'Quiz': {
                        await this.deleteQuiz(courseId, moduleItem.contentId);
                        break;
                    }
                }
            }
        }
        await this.apiRequest(`/api/v1/courses/${courseId}/modules/${moduleId}`, {
            method: 'delete'
        });
    }

    public async getModules(courseId: string): Promise<PaginatedResult<CanvasModule>> {
        return new CanvasRESTPaginatedResult(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/modules`, {
                params: {
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            (data: unknown[]) => {
                return data.map((entry: unknown) => CanvasModule.deserialize(entry));
            }
        );
    }
    public async getModuleIdByName(courseId: string, moduleName: string): Promise<string> {
        // TODO: Retrieve paginated result to avoid too many similar name
        const modules = new CanvasRESTPaginatedResult(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/modules`, {
                params: {
                    search_term: moduleName,
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            (data: unknown[]) => {
                return data.map((entry: unknown) => CanvasModule.deserialize(entry));
            }
        );
        let result: string | undefined = undefined;
        for await (const module of modules) {
            if (module.name != moduleName) continue;
            if (result == undefined) {
                result = module.id;
                continue;
            }
            throw new Error('Multiple modules found');
        }
        if (result == undefined) throw new Error('Module not found');
        return result;
    }

    public async addModuleItem(
        courseId: string,
        moduleId: string,
        type: 'Assignment' | 'Quiz',
        contentId: string
    ): Promise<string> {
        await this.safeGuardForModule(courseId, moduleId);
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/modules/${moduleId}/items`, {
            method: 'post',
            data: {
                module_item: {
                    type: type,
                    content_id: contentId
                }
            }
        });
        return data.id;
    }

    public async getAssignmentGroups(courseId: string): Promise<PaginatedResult<AssignmentGroup>> {
        return new CanvasRESTPaginatedResult<AssignmentGroup>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/assignment_groups`, {
                params: {
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            (data: unknown[]) => data.map((entry) => unwrapValidation(AssignmentGroupDef.decode(entry)))
        );
    }

    public async getAssignmentGroupIdByName(courseId: string, assignmentGroupName: string): Promise<string> {
        const assignmentGroups = await this.getAssignmentGroups(courseId);
        let result: string | undefined = undefined;
        for await (const { id, name } of assignmentGroups) {
            if (name != assignmentGroupName) continue;
            if (result == undefined) {
                result = id;
                continue;
            }
            throw new Error('Multiple assignment groups found');
        }
        if (result == undefined) throw new Error('No assignment group found');
        return result;
    }

    public async deleteAssignmentGroup(courseId: string, assignmentGroupId: string): Promise<void> {
        await this.safeGuardForAssignmentGroup(courseId, assignmentGroupId);
        await this.apiRequest(`/api/v1/courses/${courseId}/assignment_groups/${assignmentGroupId}`, {
            method: 'delete'
        });
    }

    public async createAssignmentGroup(courseId: string, assignmentGroupName: string): Promise<string> {
        const result = await this.apiRequest(`/api/v1/courses/${courseId}/assignment_groups`, {
            method: 'post',
            data: {
                name: assignmentGroupName,
                group_weight: 0
            }
        });
        return result.id;
    }

    public async deleteQuiz(courseId: string, quizId: string): Promise<void> {
        await this.safeGuardForQuiz(courseId, quizId);
        await this.apiRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}`, {
            method: 'delete'
        });
    }

    public async createQuiz(
        courseId: string,
        assignmentGroupId: string,
        title: string,
        description?: string,
        quizType = 'graded_survey'
    ): Promise<string> {
        const result = await this.apiRequest(`/api/v1/courses/${courseId}/quizzes`, {
            method: 'post',
            data: {
                quiz: {
                    title: title,
                    description: description,
                    quiz_type: quizType,
                    assignment_group_id: assignmentGroupId,
                    allowed_attempts: 100, // TODO: temporarily apply a constraint for quiz submission attempt before implementing student record pagination
                    points_possible: 0,
                    published: false
                }
            }
        });
        return result.id;
    }

    public async canQuizUnpublished(courseId: string, quizId: string) {
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}`);
        return data.unpublishable;
    }

    public async changeQuizPublishState(
        courseId: string,
        quizId: string,
        published = true,
        notifyUpdate = false
    ): Promise<boolean> {
        await this.safeGuardForQuiz(courseId, quizId);
        try {
            await this.apiRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}`, {
                method: 'put',
                data: {
                    quiz: {
                        published: published,
                        notify_of_update: notifyUpdate
                    }
                }
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            return false;
        }
        return true;
    }

    public async modifyQuiz(
        courseId: string,
        quizId: string,
        title?: string,
        description?: string,
        notifyUpdate = false
    ): Promise<string> {
        await this.safeGuardForQuiz(courseId, quizId);
        const result = await this.apiRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}`, {
            method: 'put',
            data: {
                quiz: {
                    title: title,
                    description: description,
                    notify_of_update: notifyUpdate
                }
            }
        });
        return result.id;
    }

    public async changeQuizLockDate(courseId: string, quizId: string, lockDate: Date | null): Promise<void> {
        await this.safeGuardForQuiz(courseId, quizId);
        await this.apiRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}`, {
            method: 'put',
            data: {
                quiz: {
                    lock_at: lockDate == null ? null : formatISO(lockDate)
                }
            }
        });
    }

    public async clearQuizQuestions(courseId: string, quizId: string): Promise<void> {
        await this.safeGuardForQuiz(courseId, quizId);
        const quizQuestionIds = new CanvasRESTPaginatedResult<string>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}/questions`, {
                params: {
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            (data: unknown[]) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return data.map((entry: any) => entry.id);
            }
        );
        for await (const questionId of quizQuestionIds) {
            await this.apiRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}/questions/${questionId}`, {
                method: 'delete'
            });
        }
    }

    public async createQuizQuestions(courseId: string, quizId: string, quizQuestions: QuizQuestion[]): Promise<void> {
        await this.safeGuardForQuiz(courseId, quizId);
        for (const quizQuestion of quizQuestions) {
            await this.apiRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}/questions`, {
                method: 'post',
                data: {
                    question: quizQuestion.toJSON()
                }
            });
        }
    }

    public async replaceQuizQuestions(courseId: string, quizId: string, quizQuestions: QuizQuestion[]): Promise<void> {
        await this.safeGuardForQuiz(courseId, quizId);
        const quizQuestionIds = await DataConversionHelper.convertAsyncIterableToList(
            new CanvasRESTPaginatedResult<string>(
                await this.rawAPIRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}/questions`, {
                    params: {
                        per_page: 100
                    }
                }),
                async (url: string) => await this.paginatedRequestHandler(url),
                (data: unknown[]) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return data.map((entry: any) => entry.id);
                }
            )
        );
        const minLen = Math.min(quizQuestionIds.length, quizQuestions.length);
        for (let i = 0; i < minLen; i++) {
            await this.apiRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}/questions/${quizQuestionIds[i]}`, {
                method: 'put',
                data: {
                    question: quizQuestions[i]?.toJSON()
                }
            });
        }
        for (let i = minLen; i < quizQuestionIds.length; i++) {
            await this.apiRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}/questions/${quizQuestionIds[i]}`, {
                method: 'delete'
            });
        }
        for (let i = minLen; i < quizQuestions.length; i++) {
            await this.apiRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}/questions`, {
                method: 'post',
                data: {
                    question: quizQuestions[i]?.toJSON()
                }
            });
        }
    }

    public async getQuiz(courseId: string, quizId: string): Promise<Quiz> {
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}`);
        return Quiz.deserialize(data);
    }

    public async getAssignmentOverrides(
        courseId: string,
        assignmentId: string
    ): Promise<PaginatedResult<AssignmentOverride>> {
        return new CanvasRESTPaginatedResult<AssignmentOverride>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}/overrides`, {
                params: {
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            (data: unknown[]) => data.map((entry) => unwrapValidation(AssignmentOverrideDef.decode(entry)))
        );
    }

    public async createAssignmentOverrideForStudent(
        courseId: string,
        assignmentId: string,
        studentId: string,
        overrideTitlePrefix: string,
        lockDate: Date
    ): Promise<boolean> {
        let targetOverride: AssignmentOverride | undefined = undefined,
            titleCnt = 0;
        for await (const override of await this.getAssignmentOverrides(courseId, assignmentId)) {
            if (override.isSectionLevel) continue;
            const data = override.title.split(' - ');
            if (data.length >= 3) {
                titleCnt = parseInt(data[2] as string) + 1;
            }
            if (override.studentIdsAsIndividualLevel.includes(studentId)) return false;
            if (targetOverride != undefined) continue;
            if (
                override.studentIdsAsIndividualLevel.length >= CanvasService.ASSIGNMENT_OVERRIDE_MAX_SIZE ||
                override.lockAt == undefined ||
                compareAsc(override.lockAt, lockDate) != 0
            )
                continue;
            targetOverride = override;
        }
        if (!targetOverride) {
            await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}/overrides`, {
                method: 'post',
                data: {
                    assignment_override: {
                        student_ids: [studentId],
                        title: `${overrideTitlePrefix} - ${titleCnt}`,
                        lock_at: formatISO(lockDate)
                    }
                }
            });
        } else {
            await this.apiRequest(
                `/api/v1/courses/${courseId}/assignments/${assignmentId}/overrides/${targetOverride.id}`,
                {
                    method: 'put',
                    data: {
                        assignment_override: {
                            student_ids: targetOverride.studentIdsAsIndividualLevel.concat([studentId]),
                            title: targetOverride.title,
                            lock_at: formatISO(lockDate)
                        }
                    }
                }
            );
        }
        return true;
    }

    public async deleteAssignmentOverrideForStudent(
        courseId: string,
        assignmentId: string,
        studentId: string
    ): Promise<boolean> {
        let targetOverride: AssignmentOverride | undefined = undefined;
        for await (const override of await this.getAssignmentOverrides(courseId, assignmentId)) {
            if (override.isSectionLevel || !override.studentIdsAsIndividualLevel.includes(studentId)) continue;
            targetOverride = override;
            break;
        }
        if (targetOverride == undefined) return false;
        if (targetOverride.studentIdsAsIndividualLevel.length == 1) {
            await this.apiRequest(
                `/api/v1/courses/${courseId}/assignments/${assignmentId}/overrides/${targetOverride.id}`,
                { method: 'delete' }
            );
        } else {
            targetOverride.studentIdsAsIndividualLevel.splice(
                targetOverride.studentIdsAsIndividualLevel.indexOf(studentId),
                1
            );
            await this.apiRequest(
                `/api/v1/courses/${courseId}/assignments/${assignmentId}/overrides/${targetOverride.id}`,
                {
                    method: 'put',
                    data: {
                        assignment_override: {
                            student_ids: targetOverride.studentIds,
                            title: targetOverride.title,
                            lock_at: targetOverride.lockAt ? formatISO(targetOverride.lockAt) : undefined
                        }
                    }
                }
            );
        }
        return true;
    }

    private mergeOverrideDate(a: Date | null, b: Date | null, min = true): Date | null {
        if (a == null || b == null) return null;
        if (min) {
            return compareDesc(a, b) == 1 ? a : b;
        } else {
            return compareAsc(a, b) == 1 ? a : b;
        }
    }

    private isOverrideDateEqual(a: Date | null, b: Date | null): boolean {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return isEqual(a, b);
    }

    public async extendAssignmentForStudent(
        courseId: string,
        assignmentId: string,
        studentId: string,
        overrideTitlePrefix: string
    ): Promise<boolean> {
        const overrides = await DataConversionHelper.convertAsyncIterableToList(
            await this.getAssignmentOverrides(courseId, assignmentId)
        );
        const sections = new Set(
            await DataConversionHelper.convertAsyncIterableToList(
                await this.getStudentSectionEnrollments(courseId, studentId)
            )
        );
        let lockDate: Date | null = null,
            unlockDate: Date | null = null,
            titleCnt = 0,
            hasMatchedOverride = false;
        for (const override of overrides) {
            const data = override.title.split(' - ');
            if (data.length >= 3) {
                titleCnt = parseInt(data[2] as string) + 1;
            }
            if (override.isIndividualLevel) {
                if (override.studentIdsAsIndividualLevel.includes(studentId)) return false;
                continue;
            }
            if (sections.has(override.sectionIdAsSectionLevel)) {
                if (!hasMatchedOverride) {
                    lockDate = override.lockAt;
                    unlockDate = override.unlockAt;
                    hasMatchedOverride = true;
                    continue;
                }
                lockDate = this.mergeOverrideDate(lockDate, override.lockAt, false);
                unlockDate = this.mergeOverrideDate(unlockDate, override.unlockAt, true);
            }
        }
        if (!hasMatchedOverride) {
            const assignment = await this.getAssignment(courseId, assignmentId);
            lockDate = assignment.lockAt;
            unlockDate = assignment.unlockAt;
        }
        let targetOverride: AssignmentOverride | undefined = undefined;
        for (const override of overrides) {
            if (!override.isIndividualLevel) continue;
            if (override.studentIdsAsIndividualLevel.length >= CanvasService.ASSIGNMENT_OVERRIDE_MAX_SIZE) continue;
            if (
                this.isOverrideDateEqual(unlockDate, override.unlockAt) &&
                this.isOverrideDateEqual(lockDate, override.lockAt) &&
                this.isOverrideDateEqual(lockDate, override.dueAt)
            ) {
                targetOverride = override;
                break;
            }
        }
        if (targetOverride) {
            await this.apiRequest(
                `/api/v1/courses/${courseId}/assignments/${assignmentId}/overrides/${targetOverride.id}`,
                {
                    method: 'put',
                    data: {
                        assignment_override: {
                            student_ids: targetOverride.studentIdsAsIndividualLevel.concat([studentId]),
                            title: targetOverride.title,
                            lock_at: lockDate ? formatISO(lockDate) : null,
                            unlock_at: unlockDate ? formatISO(unlockDate) : null,
                            due_at: lockDate ? formatISO(lockDate) : null
                        }
                    }
                }
            );
        } else {
            await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}/overrides`, {
                method: 'post',
                data: {
                    assignment_override: {
                        student_ids: [studentId],
                        title: `${overrideTitlePrefix} - ${titleCnt}`,
                        lock_at: lockDate ? formatISO(lockDate) : null,
                        unlock_at: unlockDate ? formatISO(unlockDate) : null,
                        due_at: lockDate ? formatISO(lockDate) : null
                    }
                }
            });
        }
        return false;
    }

    public async getAssignmentSubmission(
        courseId: string,
        assignmentId: string,
        studentId: string
    ): Promise<AssignmentSubmission> {
        return AssignmentSubmission.deserialize(
            await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`)
        );
    }

    public async getQuizzes(courseId: string): Promise<PaginatedResult<Quiz>> {
        return new CanvasRESTPaginatedResult<Quiz>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/quizzes`, {
                params: {
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            (data: unknown[]) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.filter((x: any) => x.assignment_id !== null).map((entry) => Quiz.deserialize(entry))
        );
    }

    public async getQuizIdByName(courseId: string, quizName: string) {
        const quizzes = new CanvasRESTPaginatedResult<Quiz>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/quizzes`, {
                params: {
                    search_term: quizName,
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            (data: unknown[]) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.filter((x: any) => x.assignment_id !== null).map((entry) => Quiz.deserialize(entry))
        );
        let result: string | undefined = undefined;
        for await (const quiz of quizzes) {
            if (quiz.title != quizName) continue;
            if (result == undefined) {
                result = quiz.id;
            } else {
                throw new Error('Multiple Canvas quizzes found');
            }
        }
        if (!result) throw new Error('Canvas Quiz not found');
        return result;
    }

    public async getAssignmentIdByName(courseId: string, assignmentName: string): Promise<string> {
        const assignments = new CanvasRESTPaginatedResult<Assignment>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/assignments`, {
                params: {
                    search_term: assignmentName,
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            (data: unknown[]) => data.map((entry) => unwrapValidation(AssignmentDef.decode(entry)))
        );
        let result: string | undefined = undefined;
        for await (const assignment of assignments) {
            if (assignment.name != assignmentName) continue;
            if (result == undefined) {
                result = assignment.id;
            } else {
                throw new Error('Multiple Canvas assignments found');
            }
        }
        if (!result) throw new Error('Canvas assignment not found');
        return result;
    }

    public async getStudentByEmail(courseId: string, email: string): Promise<Student | undefined> {
        const students = new CanvasRESTPaginatedResult<Student>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/users`, {
                params: {
                    enrollment_type: ['student'],
                    enrollment_state: ['active'],
                    per_page: 100,
                    search_term: email
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data: any) => data.map((entry: any) => Student.deserialize(entry))
        );
        let result = undefined;
        for await (const student of students) {
            if (student.email != email) continue;
            if (!result) {
                result = student;
                continue;
            }
            throw new Error('Multiple students found with the same email!');
        }
        return result;
    }

    public async modifyAssignmentDescription(
        courseId: string,
        assignmentId: string,
        description: string
    ): Promise<void> {
        await this.safeGuardForAssignment(courseId, assignmentId);
        await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}`, {
            method: 'put',
            data: {
                assignment: {
                    description: description
                }
            }
        });
    }

    public async modifyModuleName(courseId: string, moduleId: string, name: string): Promise<void> {
        await this.safeGuardForModule(courseId, moduleId);
        await this.apiRequest(`/api/v1/courses/${courseId}/modules/${moduleId}`, {
            method: 'put',
            data: {
                module: {
                    name: name
                }
            }
        });
    }

    public async modifyAssignmentGroupName(courseId: string, assignmentGroupId: string, name: string): Promise<void> {
        await this.safeGuardForAssignmentGroup(courseId, assignmentGroupId);
        await this.apiRequest(`/api/v1/courses/${courseId}/assignment_groups/${assignmentGroupId}`, {
            method: 'put',
            data: {
                name: name
            }
        });
    }

    public async getSections(courseId: string): Promise<PaginatedResult<Section>> {
        return new CanvasRESTPaginatedResult<Section>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/sections`, {
                params: {
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data: any) => data.map((entry: any) => Section.deserialize(entry))
        );
    }

    public async getSectionsByNames(courseId: string, sectionNames: string[]): Promise<Section[]> {
        if (new Set<string>(sectionNames).size != sectionNames.length)
            throw new Error('Invalid data: cannot have multiple sections with the same name');
        const sectionNameMap = new Map<string, Section>();
        for await (const section of await this.getSections(courseId)) sectionNameMap.set(section.name, section);
        return sectionNames.map((sectionName) => {
            if (!sectionNameMap.has(sectionName))
                throw new Error(`Invalid data: section with name ${sectionName} not found`);
            return sectionNameMap.get(sectionName) as Section;
        });
    }

    public async getStudentSectionEnrollments(courseId: string, userId: string): Promise<PaginatedResult<string>> {
        return new CanvasRESTPaginatedResult<string>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/enrollments`, {
                params: {
                    type: ['StudentEnrollment'],
                    state: ['active'],
                    user_id: userId,
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data: any) => data.map((entry: any) => entry.course_section_id)
        );
    }

    public async getSectionStudentsWithEmail(courseId: string, sectionId: string): Promise<Student[]> {
        const studentIds = new PaginatedView<string>(
            await this.rawAPIRequest(`/api/v1/sections/${sectionId}/enrollments`, {
                params: {
                    type: ['StudentEnrollment'],
                    state: ['active'],
                    per_page: 100
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data: any) => data.map((entry: any) => entry.user.id)
        );
        let isFirstPage = true;
        const students = [];
        do {
            if (isFirstPage) isFirstPage = false;
            else studentIds.next();
            students.push(
                ...(await DataConversionHelper.convertAsyncIterableToList(
                    new CanvasRESTPaginatedResult<Student>(
                        await this.rawAPIRequest(`/api/v1/courses/${courseId}/users`, {
                            params: {
                                enrollment_type: ['student'],
                                enrollment_state: ['active'],
                                per_page: 100,
                                user_ids: [...studentIds]
                            }
                        }),
                        async (url: string) => await this.paginatedRequestHandler(url),
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (data: any) => data.map((entry: any) => Student.deserialize(entry))
                    )
                ))
            );
        } while (studentIds.hasNextPage());
        return students;
    }

    /**
     * Retrieves the IANA time zone for the course.
     * @param courseId The Canvas course ID.
     * @returns A string with the course's IANA time zone name
     */
    public async getCourseTimeZone(courseId: string): Promise<string> {
        return (await this.apiRequest(`/api/v1/courses/${courseId}`))['time_zone'];
    }

    /**
     * Throws an error when the local Token ATM time zone doesn't match the Canvas Course time zone.
     * @param courseId The Canvas course ID.
     * @throws Error message reports the mismatched time zones.
     */
    public async checkSameTimeZone(courseId: string): Promise<void> {
        const data = await this.getCourseTimeZone(courseId);
        const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (data !== localTimeZone) {
            throw new Error(
                `Canvas Course and Token ATM Time Zones do not match.\n` +
                    `Canvas Course: ${data}\n` +
                    `    Token ATM: ${localTimeZone}`
            );
        }
    }

    public async isPagePublished(courseId: string, pageId: string): Promise<boolean | undefined> {
        return (await this.apiRequest(`/api/v1/courses/${courseId}/pages/${pageId}`))?.published;
    }

    public async modifyPagePublishedState(courseId: string, pageId: string, published: boolean): Promise<void> {
        await this.safeGuardForPage(courseId, pageId);
        await this.apiRequest(`/api/v1/courses/${courseId}/pages/${pageId}`, {
            method: 'put',
            data: {
                wiki_page: {
                    published: published
                }
            }
        });
    }

    public async isAssignmentPublished(courseId: string, assignmentId: string): Promise<boolean | undefined> {
        return (
            await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}`, {
                params: {
                    override_assignment_dates: false
                }
            })
        )?.published;
    }

    public async modifyAssignmentPublishedState(
        courseId: string,
        assignmentId: string,
        published: boolean
    ): Promise<void> {
        await this.safeGuardForAssignment(courseId, assignmentId);
        await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}`, {
            method: 'put',
            data: { assignment: { published: published } }
        });
    }

    public async getAssignmentGradingType(
        courseId: string,
        assignmentId: string
    ): Promise<keyof typeof CanvasGradingType> {
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}`);
        if (typeof data['grading_type'] != 'string') {
            throw new Error('Invalid data');
        }
        return data['grading_type'] as keyof typeof CanvasGradingType;
    }

    public async getAssignmentGradingTypeAndPointsPossible(
        courseId: string,
        assignmentId: string
    ): Promise<{ gradingType: keyof typeof CanvasGradingType; pointsPossible: number }> {
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}`);
        if (typeof data['grading_type'] != 'string' || typeof data['points_possible'] != 'number') {
            throw new Error('Invalid data');
        }
        return {
            gradingType: data['grading_type'] as keyof typeof CanvasGradingType,
            pointsPossible: data['points_possible']
        };
    }

    public async getSubmissionGradeAndScore(
        courseId: string,
        assignmentId: string,
        studentId: string
    ): Promise<{ grade: string | null; score: number | null; gradeMatchesCurrentSubmission: boolean }> {
        const data = await this.apiRequest(
            `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`
        );
        if (
            !(typeof data['grade'] === 'string' || data['grade'] === null) ||
            !(typeof data['score'] === 'number' || data['score'] === null) ||
            typeof data['grade_matches_current_submission'] != 'boolean'
        ) {
            throw new Error('Invalid data');
        }
        if (typeof data['entered_grade'] === 'string' || typeof data['entered_score'] === 'number') {
            if (data['grade'] !== data['entered_grade'] || data['score'] !== data['entered_score']) {
                throw new Error(
                    `Warning: Entered & Actual submission scores don’t match. Grade: ${data['entered_grade']} & ${data['grade']}. Score: ${data['entered_score']} & ${data['score']}`
                );
            }
        }
        return {
            grade: data['grade'],
            score: data['score'],
            gradeMatchesCurrentSubmission: data['grade_matches_current_submission']
        };
    }

    public async getTotalPointsPossibleInAnAssignmentGroup(
        courseId: string,
        assignmentGroupId: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        skipCountingIf?: { [x: string]: any }
    ): Promise<number> {
        const data = await this.apiRequest(
            `/api/v1/courses/${courseId}/assignment_groups/${assignmentGroupId}?include[]=assignments`
        );
        if (data['assignments'] == null) {
            throw new Error('Invalid data');
        }
        return data['assignments'].reduce(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (accumulator: number, currentAssignment: any) =>
                accumulator + collectPointsPossible(currentAssignment, skipCountingIf),
            0
        ) as number;
    }
}
