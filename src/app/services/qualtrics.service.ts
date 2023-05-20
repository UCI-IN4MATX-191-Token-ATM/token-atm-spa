import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class QualtricsService {
    #dataCenter?: string;
    #clientID?: string;
    #clientSecret?: string;

    public hasCredentialConfigured(): boolean {
        return this.#dataCenter != undefined && this.#clientID != undefined && this.#clientSecret != undefined;
    }

    async configureCredential(dataCenter: string, clientID: string, clientSecret: string): Promise<boolean> {
        this.#dataCenter = dataCenter;
        this.#clientID = clientID;
        this.#clientSecret = clientSecret;
        // TODO: validate credential
        return true;
    }
}
