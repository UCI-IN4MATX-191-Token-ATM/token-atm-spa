import { Inject, Injectable } from '@angular/core';
import type { AxiosRequestConfig } from 'axios';
import { unzipRaw } from 'unzipit';
import { AxiosService, IPCCompatibleAxiosResponse, isNetworkOrServerError } from './axios.service';
import type { QualtricsCredential } from 'app/credential-handlers/qualtrics-credential-handler';
import { ExponentialBackoffExecutorService } from './exponential-backoff-executor.service';

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
    private static RETRY_MSG = 'Fail to communicate with Qualtrics. Retrying...';
    private participationCache: Map<string, Set<string>> = new Map<string, Set<string>>();

    constructor(
        @Inject(AxiosService) private axiosService: AxiosService,
        @Inject(ExponentialBackoffExecutorService)
        private exponentialBackoffExecutorService: ExponentialBackoffExecutorService
    ) {}

    public hasCredentialConfigured(): boolean {
        return this.#dataCenter != undefined && this.#clientID != undefined && this.#clientSecret != undefined;
    }

    public async validateCredential({
        qualtricsDataCenter: dataCenter,
        qualtricsClientID: clientID,
        qualtricsClientSecret: clientSecret
    }: QualtricsCredential): Promise<unknown | undefined> {
        try {
            await this.requestQualtricsAccessToken(dataCenter, clientID, clientSecret);
        } catch (err: unknown) {
            return err;
        }
        return undefined;
    }

    public async configureCredential({
        qualtricsDataCenter: dataCenter,
        qualtricsClientID: clientID,
        qualtricsClientSecret: clientSecret
    }: QualtricsCredential): Promise<unknown | undefined> {
        this.#dataCenter = dataCenter;
        this.#clientID = clientID;
        this.#clientSecret = clientSecret;
        this.#qualtricsURL = `https://${this.#dataCenter}.qualtrics.com`;
        try {
            await this.apiRequest(`/API/v3/whoami`);
        } catch (err: unknown) {
            return err;
        }
        return undefined;
    }

    public async clearCredential() {
        this.#dataCenter = undefined;
        this.#clientID = undefined;
        this.#clientSecret = undefined;
        this.#qualtricsURL = undefined;
        this.#qualtricsAccessToken = undefined;
    }

    private async requestQualtricsAccessToken(
        dataCenter?: string,
        clientID?: string,
        clientSecret?: string
    ): Promise<string | undefined> {
        if (!dataCenter || !clientID || !clientSecret) throw new Error('Credentials for Qualtrics are invalid');
        const executor = async () => {
            return (
                await this.axiosService.request({
                    url: `https://${dataCenter}.qualtrics.com` + '/oauth2/token',
                    method: 'post',
                    auth: {
                        username: clientID,
                        password: clientSecret
                    },
                    params: {
                        grant_type: 'client_credentials',
                        scope: ['read:survey_responses', 'read:users'].join(' ')
                    }
                })
            ).data;
        };
        const data = await this.exponentialBackoffExecutorService.execute(
            executor,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async (_, err: any | undefined) => {
                return !isNetworkOrServerError(err);
            },
            QualtricsService.RETRY_MSG
        );
        return typeof data['access_token'] == 'string' ? data['access_token'] : undefined;
    }

    private async refreshQualtricsAccessToken() {
        this.#qualtricsAccessToken = await this.requestQualtricsAccessToken(
            this.#dataCenter,
            this.#clientID,
            this.#clientSecret
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async rawAPIRequest<T = any>(
        endpoint: string,
        config?: AxiosRequestConfig
    ): Promise<IPCCompatibleAxiosResponse<T>> {
        let isAccessTokenRefreshed = false;
        if (!this.#qualtricsAccessToken) {
            isAccessTokenRefreshed = true;
            await this.refreshQualtricsAccessToken();
        }
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                const executor = async () => {
                    const result = await this.axiosService.request<T>({
                        ...config,
                        url: this.#qualtricsURL + endpoint,
                        headers: {
                            ...config?.headers,
                            Authorization: 'Bearer ' + this.#qualtricsAccessToken
                        }
                    });
                    return result;
                };
                return await this.exponentialBackoffExecutorService.execute(
                    executor,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    async (_, err: any | undefined) => !isNetworkOrServerError(err),
                    QualtricsService.RETRY_MSG
                );
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async getSurveyResponseSchema(surveyId: string): Promise<any> {
        return await this.apiRequest(`/API/v3/surveys/${surveyId}/response-schema`, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async getSurveyFieldSchemas(surveyId: string): Promise<Map<string, any>> {
        const data = (await this.getSurveyResponseSchema(surveyId)).result?.properties?.values?.properties;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new Map<string, any>(data != null ? Object.entries(data) : null);
    }

    public async checkResponseSchemaForField(surveyId: string, fieldName: string): Promise<void> {
        await this.checkSurveyExists(surveyId);
        const data = await this.getSurveyFieldSchemas(surveyId);
        const names = new Set<string>();
        for (const [propName, propSchema] of data) {
            // Filters for only specific type of data
            if (propSchema?.dataType === 'embeddedData') {
                names.add(propName); // Include JSON prop. name
                if (propSchema?.exportTag) names.add(propSchema.exportTag); // Include Export Tag name
            }
        }
        if (!names.has(fieldName)) {
            throw new Error(`Field name '${fieldName}', from SSO authentication, not found in Survey`);
        }
    }

    public async checkSurveyExists(surveyId: string): Promise<void> {
        try {
            await this.getSurveyResponseSchema(surveyId);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            if (error?.isAxiosError && error?.response?.status == 404) {
                throw new Error(
                    `Survey '${surveyId}' not found on Qualtrics. Check if this survey is associated with your account.`
                );
            } else {
                throw error;
            }
        }
    }
}
