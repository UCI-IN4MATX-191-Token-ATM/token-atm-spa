import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CanvasService {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // TODO: disable unused locals check for now
    #url?: string;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // TODO: disable unused locals check for now
    #accessToken?: string;

    async configureCredential(url: string, accessToken: string): Promise<boolean> {
        this.#url = url;
        this.#accessToken = accessToken;
        // TODO: validate credential
        return true;
    }
}
