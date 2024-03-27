import { Inject, Injectable } from '@angular/core';
import { AxiosService, IPCCompatibleAxiosResponse } from './axios.service';
import type { AxiosRequestConfig } from 'axios';
import type { QuestionProCredential } from 'app/credential-handlers/question-pro-credential-handler';
import type { PaginatedResult } from 'app/utils/pagination/paginated-result';
import { QuestionProPaginatedResult } from 'app/utils/pagination/question-pro-paginated-result';
import type { QuestionProSurveyMixinData } from 'app/token-options/mixins/question-pro-survey-mixin';

@Injectable({
    providedIn: 'root'
})
export class QuestionProService {
    #env?: string;
    #userId?: string;
    #apiKey?: string;

    private participationCache: Map<string, Map<string, Set<string>>> = new Map<string, Map<string, Set<string>>>();

    constructor(@Inject(AxiosService) private axiosService: AxiosService) {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #rawAPIRequest<T = any>(
        endpoint: string,
        config?: AxiosRequestConfig,
        credential?: QuestionProCredential
    ): Promise<IPCCompatibleAxiosResponse<T>> {
        const env = credential?.questionProEnv ?? this.#env;
        const apiKey = credential?.questionProAPIKey ?? this.#apiKey;
        return this.axiosService.request<T>({
            ...config,
            url: `https://api.questionpro.${env}/a/api/v2` + endpoint,
            headers: {
                ...config?.headers,
                'api-key': apiKey
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async #apiRequest<T = any>(
        endpoint: string,
        config?: AxiosRequestConfig,
        credential?: QuestionProCredential
    ): Promise<T> {
        return (await this.#rawAPIRequest<T>(endpoint, config, credential)).data;
    }

    public hasCredentialConfigured(): boolean {
        return this.#env !== undefined && this.#userId !== undefined && this.#apiKey !== undefined;
    }

    public async validateCredential(credential: QuestionProCredential): Promise<unknown | undefined> {
        try {
            await this.#apiRequest(`/users/${credential.questionProUserId}`, {}, credential);
        } catch (err: unknown) {
            return err;
        }
        return undefined;
    }

    public async clearCredential() {
        this.#env = undefined;
        this.#userId = undefined;
        this.#apiKey = undefined;
    }

    public clearCache() {
        this.participationCache.clear();
    }

    public async configureCredential({
        questionProEnv,
        questionProUserId,
        questionProAPIKey
    }: QuestionProCredential): Promise<unknown | undefined> {
        this.#env = questionProEnv;
        this.#userId = questionProUserId;
        this.#apiKey = questionProAPIKey;
        return undefined;
    }

    public async getSurveys(): Promise<PaginatedResult<[string, string]>> {
        return new QuestionProPaginatedResult(
            await this.#rawAPIRequest(`/users/${this.#userId}/surveys`, {
                params: {
                    perPage: 1000,
                    page: 1
                }
            }),
            (url: string) => this.#rawAPIRequest(url),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (v) => v.map((x: any) => [x['surveyID'].toString(), x['name']])
        );
    }

    public async hasSurvey(surveyId: string): Promise<boolean> {
        try {
            await this.#apiRequest(`/surveys/${surveyId}`);
        } catch (_: unknown) {
            return false;
        }
        return true;
    }

    public async getQuestions(surveyId: string): Promise<PaginatedResult<[string, string]>> {
        // TODO: support unpacking questions with multiple rows (e.g., contact_information)
        return new QuestionProPaginatedResult(
            await this.#rawAPIRequest(`/surveys/${surveyId}/questions`, {
                params: {
                    perPage: 1000,
                    page: 1
                }
            }),
            (url: string) => this.#rawAPIRequest(url),
            (v) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                v.map((x: any) => {
                    if (x['type'] == 'text_email') return [x['questionID'].toString(), x['rows'][0]['text']];
                    return [x['questionID'].toString(), x['text']];
                })
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async getResponses(surveyId: string): Promise<PaginatedResult<any>> {
        return new QuestionProPaginatedResult(
            await this.#rawAPIRequest(`/surveys/${surveyId}/questions`, {
                params: {
                    perPage: 1000,
                    page: 1
                }
            }),
            (url: string) => this.#rawAPIRequest(url),
            (v) => v
        );
    }

    public async hasQuestion(surveyId: string, questionId: string): Promise<boolean> {
        try {
            await this.#apiRequest(`/surveys/${surveyId}/questions/${questionId}`);
        } catch (_: unknown) {
            return false;
        }
        return true;
    }

    private getTypeStr(responseField: QuestionProSurveyMixinData['responseField']): string {
        return responseField.type == 'customVariable'
            ? `customVariable: ${responseField.variableName}`
            : `studentResponse: ${responseField.questionId}`;
    }

    private async cacheSurveyParticipation(
        surveyId: string,
        responseField: QuestionProSurveyMixinData['responseField']
    ): Promise<void> {
        const typeStr = this.getTypeStr(responseField);
        if (!this.participationCache.has(surveyId))
            this.participationCache.set(surveyId, new Map<string, Set<string>>());
        if (this.participationCache.get(surveyId)?.has(typeStr)) return;
        this.participationCache.get(surveyId)?.set(typeStr, new Set<string>());
        const tmpSet = this.participationCache.get(surveyId)?.get(typeStr);
        const responses = await this.getResponses(surveyId);
        for await (const response of responses) {
            if (responseField.type == 'customVariable') {
                const data = response?.['customVariables'][responseField.variableName];
                if (!data) continue;
                tmpSet?.add(data);
            } else {
                if (!Array.isArray(response?.['responseSet'])) continue;
                for (const v of response['responseSet']) {
                    if (v?.['questionID'].toString() != responseField.questionId) continue;
                    if (!Array.isArray(v?.['answerValues'])) continue;
                    const data = v?.['answerValues']?.[0]?.['answerText'];
                    if (!data) continue;
                    tmpSet?.add(data);
                }
            }
        }
    }

    public async checkParticipation(
        surveyId: string,
        responseField: QuestionProSurveyMixinData['responseField'],
        participationId: string
    ): Promise<boolean> {
        await this.cacheSurveyParticipation(surveyId, responseField);
        return (
            this.participationCache.get(surveyId)?.get(this.getTypeStr(responseField))?.has(participationId) ?? false
        );
    }
}
