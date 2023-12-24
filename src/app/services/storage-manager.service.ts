import { Injectable } from '@angular/core';
import type { TokenATMCredentials } from 'app/data/token-atm-credentials';
import { CryptoHelper } from 'app/utils/crypto-helper';
import { Base64 } from 'js-base64';

@Injectable({
    providedIn: 'root'
})
export class StorageManagerService {
    #storageKey?: CryptoKey;
    #storage = new Map<string, string>();
    #isStorageInitialized = false;
    #isStoring = false;
    #hasUpdate = false;

    private getStoredItem(key: string, isRequired = true): string {
        const result = localStorage.getItem(key);
        if (!isRequired) return result ?? '';
        if (result == null) throw new Error(`${key} not found in localStorage`);
        return result;
    }

    public async storeCredentials(credentials: TokenATMCredentials, password: string): Promise<void> {
        const salt = window.crypto.getRandomValues(new Uint8Array(32));
        const key = await CryptoHelper.deriveAESKey(password, salt);
        const [iv, data] = await CryptoHelper.encryptAES(key, JSON.stringify(credentials));
        localStorage.setItem('salt', Base64.fromUint8Array(salt));
        localStorage.setItem('iv', Base64.fromUint8Array(iv));
        localStorage.setItem('data', Base64.fromUint8Array(data));
        this.initStorage(key);
    }

    private async initStorageKey(key: CryptoKey): Promise<void> {
        const generatedKey = await CryptoHelper.generateAESKey(true);
        localStorage.setItem(
            'storage_key',
            Base64.fromUint8Array(
                await CryptoHelper.encryptAESRawWithIV(
                    key,
                    new Uint8Array(await window.crypto.subtle.exportKey('raw', generatedKey))
                )
            )
        );
        this.#storageKey = await window.crypto.subtle.importKey(
            'raw',
            await CryptoHelper.decryptAESRawWithIV(key, Base64.toUint8Array(this.getStoredItem('storage_key'))),
            {
                name: 'AES-GCM'
            },
            false,
            ['encrypt', 'decrypt']
        );
    }

    private async initStorage(key: CryptoKey): Promise<void> {
        localStorage.removeItem('storage_data');
        this.initStorageKey(key);
        this.#storage.clear();
        this.#isStorageInitialized = true;
    }

    private async loadStorage(key: CryptoKey): Promise<void> {
        const oldKey = await window.crypto.subtle.importKey(
            'raw',
            await CryptoHelper.decryptAESRawWithIV(key, Base64.toUint8Array(this.getStoredItem('storage_key'))),
            {
                name: 'AES-GCM'
            },
            false,
            ['encrypt', 'decrypt']
        );
        const storedData = localStorage.getItem('storage_data');
        if (storedData == null) {
            this.#storage.clear();
        } else {
            this.#storage = new Map<string, string>(
                JSON.parse(await CryptoHelper.decryptAESWithIV(oldKey, Base64.toUint8Array(storedData)))
            );
        }
        await this.initStorageKey(key);
        this.#isStorageInitialized = true;
        await this.saveStorage();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private upgradeCredentials(data: any): TokenATMCredentials {
        if (!('canvasURL' in data)) return data;
        return <TokenATMCredentials>{
            canvas: {
                canvasURL: data['canvasURL'],
                canvasAccessToken: data['canvasAccessToken']
            },
            qualtrics: {
                qualtricsDataCenter: data['qualtricsDataCenter'],
                qualtricsClientID: data['qualtricsClientID'],
                qualtricsClientSecret: data['qualtricsClientSecret']
            }
        };
    }

    public async retrieveCredentials(password: string): Promise<TokenATMCredentials> {
        const salt = new Uint8Array(Base64.toUint8Array(this.getStoredItem('salt')));
        const key = await CryptoHelper.deriveAESKey(password, salt);
        const iv = new Uint8Array(Base64.toUint8Array(this.getStoredItem('iv')));
        const encryptedData = new Uint8Array(Base64.toUint8Array(this.getStoredItem('data')));
        const data = await CryptoHelper.decryptAES(key, encryptedData, iv);
        if (localStorage.getItem('storage_key') == null) {
            await this.initStorage(key);
        } else {
            await this.loadStorage(key);
        }
        return this.upgradeCredentials(JSON.parse(data));
    }

    public get isStorageInitialized(): boolean {
        return this.#isStorageInitialized;
    }

    public async updateEntry(key: string, value: string): Promise<void> {
        if (!this.isStorageInitialized || !this.#storageKey) throw new Error('Secure storage is not initialized!');
        if (value == this.#storage.get(key)) return;
        this.#storage.set(key, value);
        await this.saveStorage();
    }

    public async saveStorage(): Promise<void> {
        if (!this.isStorageInitialized || !this.#storageKey) throw new Error('Secure storage is not initialized!');
        this.#hasUpdate = true;
        if (this.#isStoring) return;
        while (this.#hasUpdate) {
            this.#hasUpdate = false;
            this.#isStoring = true;
            const storageData = JSON.stringify(Array.from(this.#storage.entries()));
            const encryptedData = await CryptoHelper.encryptAESWithIV(this.#storageKey, storageData);
            if (this.#hasUpdate) continue;
            localStorage.setItem('storage_data', Base64.fromUint8Array(encryptedData));
            this.#isStoring = false;
        }
    }

    public getEntry(key: string): string | undefined {
        return this.#storage.get(key);
    }

    public hasCredentials(): boolean {
        return (
            localStorage.getItem('salt') != null &&
            localStorage.getItem('iv') != null &&
            localStorage.getItem('data') != null
        );
    }

    public clearCredentials(): void {
        localStorage.removeItem('salt');
        localStorage.removeItem('iv');
        localStorage.removeItem('data');
        localStorage.removeItem('storage_key');
        localStorage.removeItem('storage_data');
    }
}
