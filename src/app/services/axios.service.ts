/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { Axios, AxiosRequestConfig, AxiosResponse } from 'axios';

type AxiosServiceHeader = Pick<Axios, 'head' | 'options' | 'put' | 'post' | 'patch' | 'delete' | 'get' | 'request'>;
const AXIOS_METHODS = ['head', 'options', 'put', 'post', 'patch', 'delete', 'get', 'request'];

// Auto-generated since cannot use Pick to directly create an abstract class.
// Abstract class is needed since Angular requires it as a value to perform dependency injection.
export abstract class AxiosService implements AxiosServiceHeader {
    abstract head<T = any, R = AxiosResponse<T, any>, D = any>(
        url: string,
        config?: AxiosRequestConfig<D> | undefined
    ): Promise<R>;
    abstract options<T = any, R = AxiosResponse<T, any>, D = any>(
        url: string,
        config?: AxiosRequestConfig<D> | undefined
    ): Promise<R>;
    abstract put<T = any, R = AxiosResponse<T, any>, D = any>(
        url: string,
        data?: D | undefined,
        config?: AxiosRequestConfig<D> | undefined
    ): Promise<R>;
    abstract post<T = any, R = AxiosResponse<T, any>, D = any>(
        url: string,
        data?: D | undefined,
        config?: AxiosRequestConfig<D> | undefined
    ): Promise<R>;
    abstract patch<T = any, R = AxiosResponse<T, any>, D = any>(
        url: string,
        data?: D | undefined,
        config?: AxiosRequestConfig<D> | undefined
    ): Promise<R>;
    abstract delete<T = any, R = AxiosResponse<T, any>, D = any>(
        url: string,
        config?: AxiosRequestConfig<D> | undefined
    ): Promise<R>;
    abstract get<T = any, R = AxiosResponse<T, any>, D = any>(
        url: string,
        config?: AxiosRequestConfig<D> | undefined
    ): Promise<R>;
    abstract request<T = any, R = AxiosResponse<T, any>, D = any>(config: AxiosRequestConfig<D>): Promise<R>;
}

export class AxiosServiceFactory {
    public static getAxiosService(): AxiosService {
        const proxy = (window as any).axiosProxy;
        if (!proxy) {
            return axios;
        }
        return new Proxy(
            {},
            {
                get(_, prop) {
                    if (typeof prop == 'symbol' || !AXIOS_METHODS.includes(prop)) return undefined;
                    return (...args: unknown[]) => {
                        return proxy(prop, ...args);
                    };
                }
            }
        ) as AxiosService;
    }
}
