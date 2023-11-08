import { Inject, Injectable } from '@angular/core';
import type { AxiosRequestConfig } from 'axios';
import { unzipRaw } from 'unzipit';
import { AxiosService, IPCCompatibleAxiosResponse, isNetworkOrServerError } from './axios.service';
import { ExponentialBackoffExecutor } from 'app/utils/exponential-backoff-executor';

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
    private surveyIdCache: Set<string> = new Set<string>();

    constructor(@Inject(AxiosService) private axiosService: AxiosService) {}

    public hasCredentialConfigured(): boolean {
        return this.#dataCenter != undefined && this.#clientID != undefined && this.#clientSecret != undefined;
    }

    public async configureCredential(
        dataCenter: string,
        clientID: string,
        clientSecret: string
    ): Promise<unknown | undefined> {
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

    private async refreshQualtricsAccessToken() {
        const executor = async () => {
            if (!this.#qualtricsURL || !this.#clientID || !this.#clientSecret)
                throw new Error('Credentials for Qualtrics are invalid');
            return (
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
        };
        const data = await ExponentialBackoffExecutor.execute(
            executor,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async (_, err: any | undefined) => !isNetworkOrServerError(err)
        );
        if (typeof data['access_token'] == 'string') {
            this.#qualtricsAccessToken = data['access_token'];
        } else {
            this.#qualtricsAccessToken = undefined;
        }
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
                return await ExponentialBackoffExecutor.execute(
                    executor,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    async (_, err: any | undefined) => !isNetworkOrServerError(err)
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

    private async cacheSurveyIds(offset?: string): Promise<void> {
        // NOTE: List Survey API requires greater API scope,
        //       so this code won't work at the moment (requires `read:surveys`)
        const data = await this.apiRequest(`/API/v3/surveys${offset ?? ''}`, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log(data); // TODO: Double check JSON
        console.log('Offset string:', offset); // TODO: Double check
        const ids: string[] =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.results?.elements?.map((x: any) => x.id).filter((x: any) => x) ?? new Array<string>();
        for (const id of ids) {
            this.surveyIdCache.add(id);
        }
        const next: string | null = data.results?.nextPage;
        console.log(next);
        if (next) {
            console.log('Generated API request:', `/API/v3/surveys${next ?? ''}`);
            // this.cacheSurveyIds(data.results.nextPage); // TODO: Compare above before executing
        }
    }

    public async checkSurveyId(surveyId: string): Promise<boolean> {
        if (this.surveyIdCache.size === 0) await this.cacheSurveyIds();
        return this.surveyIdCache.has(surveyId);
    }

    public clearCache(): void {
        this.participationCache.clear();
        this.surveyIdCache.clear();
    }
}
