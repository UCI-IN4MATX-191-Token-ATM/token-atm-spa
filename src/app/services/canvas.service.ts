import { Inject, Injectable } from '@angular/core';
import { Course } from 'app/data/course';
import { PaginatedResult } from 'app/utils/paginated-result';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AxiosService } from './axios.service';

@Injectable({
    providedIn: 'root'
})
export class CanvasService {
    #url?: string;
    #accessToken?: string;

    constructor(@Inject(AxiosService) private axiosService: AxiosService) {}

    public async configureCredential(url: string, accessToken: string): Promise<boolean> {
        this.#url = url;
        this.#accessToken = accessToken;
        // TODO: validate credential
        return true;
    }

    private async rawAPIRequest<T>(
        endpoint: string,
        config: AxiosRequestConfig | undefined
    ): Promise<AxiosResponse<T>> {
        return await this.axiosService.request({
            ...config,
            url: this.#url + endpoint,
            headers: {
                ...config?.headers,
                Accept: 'application/json+canvas-string-ids',
                Authorization: 'Bearer ' + this.#accessToken
            }
        });
    }

    // private async apiRequest<T>(endpoint: string, config: AxiosRequestConfig | undefined): Promise<T> {
    //     return (await this.rawAPIRequest<T>(endpoint, config)).data;
    // }

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
                per_page: 1,
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
}
