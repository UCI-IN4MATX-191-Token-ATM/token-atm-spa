import { Inject, Injectable } from '@angular/core';
import { Course } from 'app/data/course';
import { ModuleItemInfo } from 'app/data/module-item-info';
import { QuizSubmission } from 'app/data/quiz-submission';
import { Student } from 'app/data/student';
import { SubmissionComment } from 'app/data/submission-comment';
import { PaginatedResult } from 'app/utils/paginated-result';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { formatISO, parseISO } from 'date-fns';
import { AxiosService } from './axios.service';
import { User } from 'app/data/user';
import type { QuizQuestion } from 'app/quiz-questions/quiz-question';

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

    public async deletePage(courseId: string, pageId: string): Promise<void> {
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
        const response = await this.rawAPIRequest(`/api/v1/courses/${courseId}/pages`, {
            params: {
                search_term: pageName
            }
        });
        if (!Array.isArray(response.data)) throw new Error('Page fetch error');
        if (response.data.length == 0) throw new Error('Page not found'); // TODO: redirect to creation
        if (response.data.length > 1) throw new Error('Multiple pages found'); // TODO: redirect to duplication handling
        return response.data[0]['page_id'];
    }

    public async getPageContentByName(courseId: string, pageName: string): Promise<string> {
        const content = await this.getPageContentById(courseId, await this.getPageIdByName(courseId, pageName));
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

    public async postComment(
        courseId: string,
        studentId: string,
        assignmentId: string,
        comment: string
    ): Promise<SubmissionComment> {
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
                result = new SubmissionComment(submissionComments[i]);
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
        const data = await this.apiRequest(
            `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}/comments/${commentId}`,
            {
                method: 'put',
                data: {
                    comment: comment
                }
            }
        );
        return new SubmissionComment(data);
    }

    public async gradeSubmissionWithPostingComment(
        courseId: string,
        studentId: string,
        assignmentId: string,
        score: number,
        newComment: string
    ): Promise<SubmissionComment> {
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
                result = new SubmissionComment(submissionComments[i]);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                continue;
            }
            if (result.content != newComment) continue;
            return result;
        }
        throw new Error('Comment creation failed');
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

    public async getModuleScore(courseId: string, moduleId: string, studentId: string): Promise<[number, number]> {
        let obtainedPoints = 0,
            totalPoints = 0;
        const moduleItems = new PaginatedResult<ModuleItemInfo>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/modules/${moduleId}/items`, {
                params: {
                    include: ['content_details']
                }
            }),
            async (url: string) => await this.paginatedRequestHandler(url),
            (data: unknown[]) => {
                return data.map((entry: unknown) => new ModuleItemInfo(entry));
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
        if (deleteAllModuleItems) {
            const moduleItems = new PaginatedResult<ModuleItemInfo>(
                await this.rawAPIRequest(`/api/v1/courses/${courseId}/modules/${moduleId}/items`, {
                    params: {
                        include: ['content_details']
                    }
                }),
                async (url: string) => await this.paginatedRequestHandler(url),
                (data: unknown[]) => {
                    return data.map((entry: unknown) => new ModuleItemInfo(entry));
                }
            );
            for await (const moduleItem of moduleItems) {
                if (!moduleItem.contentId) continue;
                switch (moduleItem.type) {
                    case 'Assignment': {
                        this.deleteAssignment(courseId, moduleItem.contentId);
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

    public async getModuleIdByName(courseId: string, moduleName: string) {
        const data = await this.apiRequest(`/api/v1/courses/${courseId}/modules`, {
            params: {
                search_term: moduleName
            }
        });

        if (!Array.isArray(data)) throw new Error('Module fetch error');
        if (data.length == 0) throw new Error('Module not found');
        if (data.length > 1) throw new Error('Multiple modules found');
        return data[0].id;
    }

    public async addModuleItem(
        courseId: string,
        moduleId: string,
        type: 'Assignment' | 'Quiz',
        contentId: string
    ): Promise<string> {
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

    public async getAssignmentGroupIdByName(courseId: string, assignmentGroupName: string) {
        const assignmentGroups = new PaginatedResult<[string, string]>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/assignment_groups`),
            async (url: string) => await this.paginatedRequestHandler(url),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return data.map((entry: any) => [entry.id, entry.name]);
            }
        );
        let result: string | undefined = undefined;
        for await (const [id, name] of assignmentGroups) {
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
                    allowed_attempts: -1,
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
        const quizQuestionIds = new PaginatedResult<string>(
            await this.rawAPIRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}/questions`),
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
        for (const quizQuestion of quizQuestions) {
            await this.apiRequest(`/api/v1/courses/${courseId}/quizzes/${quizId}/questions`, {
                method: 'post',
                data: {
                    question: quizQuestion.toJSON()
                }
            });
        }
    }
}
