import {
    EnvironmentInjector,
    Inject,
    Injectable,
    InjectionToken,
    Optional,
    Type,
    ViewContainerRef
} from '@angular/core';
import type { FormField } from 'app/utils/form-field/form-field';
import type { TokenATMCredentials } from 'app/data/token-atm-credentials';
import { CanvasService } from './canvas.service';

export interface CredentialHandler<T extends object> {
    key: string;
    descriptiveName: string;
    documentLink: string;
    has(credentials: TokenATMCredentials): boolean;
    get(credentials: TokenATMCredentials): T | undefined;
    set(credentials: TokenATMCredentials, credential: T): void;
    delete(credentials: TokenATMCredentials): void;
    validate(credential: T): Promise<unknown | undefined>;
    configure(credential: T): Promise<void>;
    clear(): void;
    generateErrorMessage(credential: T): string;
    isConfigured(): boolean;
    buildFormFieldComponent(
        environmentInjector: EnvironmentInjector
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): [(viewContainerRef: ViewContainerRef) => void, FormField<T, T, any>];
}

export const REGISTERED_CREDENTIAL_HANDLERS: Type<CredentialHandler<object>>[] = [];

export const CREDENTIAL_HANDLER_INJECT_TOKEN = new InjectionToken<CredentialHandler<object>[]>('CREDENTIAL_HANDLERS');

export function RegisterCredentialHandler(cls: Type<CredentialHandler<object>>) {
    REGISTERED_CREDENTIAL_HANDLERS.push(cls);
}

const REQUIRED_CREDENTIALS_SYMBOL = Symbol('REQUIRED_CREDENTIALS');

type ClassRequiresCredentials = {
    [REQUIRED_CREDENTIALS_SYMBOL]?: Set<string>;
};

export function RequireCredentials(credentials: string | string[]) {
    return (value: unknown) => {
        const cls = value as ClassRequiresCredentials;
        if (!Array.isArray(credentials)) credentials = [credentials];
        if (!Object.hasOwn(cls, REQUIRED_CREDENTIALS_SYMBOL)) {
            const value = cls[REQUIRED_CREDENTIALS_SYMBOL];
            Object.defineProperty(cls, REQUIRED_CREDENTIALS_SYMBOL, {
                value: value ? structuredClone(value) : new Set<string>(),
                writable: false
            });
        }
        credentials.forEach((x) => cls[REQUIRED_CREDENTIALS_SYMBOL]?.add(x));
    };
}

@Injectable({
    providedIn: 'root'
})
export class CredentialManagerService {
    private _credentialHandlers = new Map<string, CredentialHandler<object>>();

    constructor(
        @Optional() @Inject(CREDENTIAL_HANDLER_INJECT_TOKEN) credentialHandlers: CredentialHandler<object>[],
        @Inject(CanvasService) private canvasService: CanvasService
    ) {
        if (credentialHandlers)
            credentialHandlers.forEach((handler) => this._credentialHandlers.set(handler.key, handler));
    }

    public getRegisteredCredentials(): string[] {
        return [...this._credentialHandlers.keys()];
    }

    public getHandlers(): CredentialHandler<object>[] {
        return [...this._credentialHandlers.values()];
    }

    public getHandler(key: string): CredentialHandler<object> {
        const res = this._credentialHandlers.get(key);
        if (res === undefined) throw new Error(`Credential Handler with key ${key} not found`);
        return res;
    }

    public isConfigured(key: string): boolean {
        const handler = this._credentialHandlers.get(key);
        if (!handler) return false;
        return handler.isConfigured();
    }

    public async configure(credentials: TokenATMCredentials): Promise<void> {
        for (const handler of this._credentialHandlers.values()) {
            const credential = handler.get(credentials);
            if (!credential) continue;
            await handler.configure(credential);
        }
    }

    public async validate(credentials: TokenATMCredentials): Promise<[string, object, unknown][]> {
        const result: [string, object, unknown][] = [];
        for (const handler of this._credentialHandlers.values()) {
            const credential = handler.get(credentials);
            if (!credential) continue;
            result.push([handler.key, credential, await handler.validate(credential)]);
        }
        return result;
    }

    public hasCredential(credentials: TokenATMCredentials, credential: string): boolean {
        const handler = this._credentialHandlers.get(credential);
        if (!handler) return false;
        return handler.has(credentials);
    }

    public clear(): void {
        this.canvasService.clearCredential();
        for (const handler of this._credentialHandlers.values()) {
            handler.clear();
        }
    }

    public hasMissingCredentials(value: object): boolean {
        const credentials = (value.constructor as ClassRequiresCredentials)[REQUIRED_CREDENTIALS_SYMBOL];
        if (!credentials) return false;
        for (const key of credentials) {
            const handler = this._credentialHandlers.get(key);
            if (!handler || !handler.isConfigured()) return true;
        }
        return false;
    }

    public getMissingCredentialsDescription(value: object): Set<string> {
        const credentials = (value.constructor as ClassRequiresCredentials)[REQUIRED_CREDENTIALS_SYMBOL];
        if (!credentials) return new Set<string>();
        const res = new Set<string>();
        for (const key of credentials) {
            const handler = this._credentialHandlers.get(key);
            if (!handler) res.add(key);
            else if (!handler.isConfigured()) res.add(handler.descriptiveName);
        }
        return res;
    }
}
