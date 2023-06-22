import { Inject, Injectable } from '@angular/core';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { unzipRaw } from 'unzipit';
import { AxiosService } from './axios.service';

@Injectable({
    providedIn: 'root'
})
export class QualtricsService {
    #dataCenter?: string;
    #clientID?: string;
    #clientSecret?: string;
    #qualtricsAccessToken?: string;
    #qualtricsURL?: string;
    private static WAIT_SECONDS = 2;
    private participationCache: Map<string, Set<string>> = new Map<string, Set<string>>();

    constructor(@Inject(AxiosService) private axiosService: AxiosService) {}

    public hasCredentialConfigured(): boolean {
        return this.#dataCenter != undefined && this.#clientID != undefined && this.#clientSecret != undefined;
    }

    public async configureCredential(dataCenter: string, clientID: string, clientSecret: string): Promise<boolean> {
        this.#dataCenter = dataCenter;
        this.#clientID = clientID;
        this.#clientSecret = clientSecret;
        this.#qualtricsURL = `https://${this.#dataCenter}.qualtrics.com`;
        // TODO: validate credential
        return true;
    }

    private async refreshQualtricsAccessToken() {
        if (!this.#qualtricsURL || !this.#clientID || !this.#clientSecret)
            throw new Error('Credentials for Qualtrics are invalid');
        const data = (
            await this.axiosService.request({
                url: this.#qualtricsURL + '/oauth2/token',
                method: 'post',
                auth: {
                    username: this.#clientID,
                    password: this.#clientSecret
                },
                params: {
                    grant_type: 'client_credentials',
                    scope: ['read:survey_responses', 'read:users'].join(' ')
                }
            })
        ).data;
        if (typeof data['access_token'] == 'string') {
            this.#qualtricsAccessToken = data['access_token'];
        } else {
            this.#qualtricsAccessToken = undefined;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async rawAPIRequest<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        let isAccessTokenRefreshed = false;
        if (!this.#qualtricsAccessToken) {
            isAccessTokenRefreshed = true;
            await this.refreshQualtricsAccessToken();
        }
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                const result = await this.axiosService.request({
                    ...config,
                    url: this.#qualtricsURL + endpoint,
                    headers: {
                        ...config?.headers,
                        Authorization: 'Bearer ' + this.#qualtricsAccessToken
                    }
                });
                return result;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                if (err.response && err.response.status == 401 && !isAccessTokenRefreshed) {
                    isAccessTokenRefreshed = true;
                    await this.refreshQualtricsAccessToken();
                    continue;
                }
                throw err;
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async apiRequest<T = any>(endpoint: string, config?: AxiosRequestConfig | undefined): Promise<T> {
        return (await this.rawAPIRequest<T>(endpoint, config)).data;
    }

    private async cacheSurveyParticipation(surveyId: string, fieldName: string): Promise<void> {
        const result = new Set<string>();
        const progressId = (
            await this.apiRequest(`/API/v3/surveys/${surveyId}/export-responses`, {
                method: 'post',
                data: {
                    format: 'json',
                    questionIds: [],
                    surveyMetadataIds: ['recordedDate', 'finished']
                }
            })
        ).result.progressId;
        let fileId = '';
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const data = await this.apiRequest(`/API/v3/surveys/${surveyId}/export-responses/${progressId}`);
            if (data.result.status == 'complete') {
                fileId = data.result.fileId;
                break;
            } else {
                await new Promise((resolve) => setTimeout(resolve, QualtricsService.WAIT_SECONDS * 1000));
            }
        }
        const data = await this.apiRequest<ArrayBuffer>(`/API/v3/surveys/${surveyId}/export-responses/${fileId}/file`, {
            responseType: 'arraybuffer'
        });
        for (const zipEntry of (await unzipRaw(data)).entries) {
            const surveyResponses = await zipEntry.json();
            if (!Array.isArray(surveyResponses['responses'])) continue;
            for (const surveyResponse of surveyResponses['responses']) {
                if (
                    !surveyResponse?.values?.finished ||
                    (surveyResponse.values.finished != 1 &&
                        surveyResponse.values.finished != true &&
                        surveyResponse.values.finished != 'True')
                )
                    continue;
                const participationId = surveyResponse?.values?.[fieldName];
                if (typeof participationId == 'string') {
                    result.add(participationId);
                }
            }
        }
        this.participationCache.set(surveyId, result);
    }

    public async checkParticipation(surveyId: string, fieldName: string, participationId: string): Promise<boolean> {
        if (!this.participationCache.has(surveyId)) await this.cacheSurveyParticipation(surveyId, fieldName);
        return this.participationCache.get(surveyId)?.has(participationId) ?? false;
    }

    public clearCache(): void {
        this.participationCache.clear();
    }
}
