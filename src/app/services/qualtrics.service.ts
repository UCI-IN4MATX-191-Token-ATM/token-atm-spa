import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class QualtricsService {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // TODO: disable unused locals check for now
    #dataCenter?: string;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // TODO: disable unused locals check for now
    #clientID?: string;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // TODO: disable unused locals check for now
    #clientSecret?: string;

    async configureCredential(dataCenter: string, clientID: string, clientSecret: string): Promise<boolean> {
        this.#dataCenter = dataCenter;
        this.#clientID = clientID;
        this.#clientSecret = clientSecret;
        // TODO: validate credential
        return true;
    }
}
