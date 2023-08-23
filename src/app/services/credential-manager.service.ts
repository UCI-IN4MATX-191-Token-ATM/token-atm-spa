import { Injectable } from '@angular/core';
import type { TokenATMCredentials } from 'app/data/token-atm-credentials';
import { CryptoHelper } from 'app/utils/crypto-helper';
import { Base64 } from 'js-base64';

@Injectable({
    providedIn: 'root'
})
export class CredentialManagerService {
    #publicKey?: CryptoKey;
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
        this.initStorage(key, iv);
    }

    private async initStorage(key: CryptoKey, iv: Uint8Array): Promise<void> {
        const rsaKey = await CryptoHelper.generateRSAOAEPKeyPair();
        localStorage.setItem(
            'storage_key_priv',
            Base64.fromUint8Array(
                (
                    await CryptoHelper.encryptAESRaw(
                        key,
                        new Uint8Array(await window.crypto.subtle.exportKey('pkcs8', rsaKey.privateKey)),
                        iv
                    )
                )[1]
            )
        );
        localStorage.setItem(
            'storage_key_pub',
            Base64.fromUint8Array(
                (
                    await CryptoHelper.encryptAESRaw(
                        key,
                        new Uint8Array(await window.crypto.subtle.exportKey('spki', rsaKey.publicKey)),
                        iv
                    )
                )[1]
            )
        );
        this.#publicKey = rsaKey.publicKey;
        this.#storage.clear();
        this.#isStorageInitialized = true;
    }

    private async loadStorage(key: CryptoKey, iv: Uint8Array): Promise<void> {
        const privateKey = await window.crypto.subtle.importKey(
            'pkcs8',
            await CryptoHelper.decryptAESRaw(key, Base64.toUint8Array(this.getStoredItem('storage_key_priv')), iv),
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256'
            },
            false,
            ['decrypt']
        );
        const storedData = localStorage.getItem('storage_data');
        if (storedData == null) {
            this.#storage.clear();
        } else {
            this.#storage = new Map<string, string>(
                JSON.parse(await CryptoHelper.decryptRSA(privateKey, Base64.toUint8Array(storedData)))
            );
        }
        this.#publicKey = await window.crypto.subtle.importKey(
            'spki',
            await CryptoHelper.decryptAESRaw(key, Base64.toUint8Array(this.getStoredItem('storage_key_pub')), iv),
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256'
            },
            false,
            ['encrypt']
        );
        this.#isStorageInitialized = true;
    }

    public async retrieveCredentials(password: string): Promise<TokenATMCredentials> {
        const salt = new Uint8Array(Base64.toUint8Array(this.getStoredItem('salt')));
        const key = await CryptoHelper.deriveAESKey(password, salt);
        const iv = new Uint8Array(Base64.toUint8Array(this.getStoredItem('iv')));
        const encryptedData = new Uint8Array(Base64.toUint8Array(this.getStoredItem('data')));
        const data = await CryptoHelper.decryptAES(key, encryptedData, iv);
        if (localStorage.getItem('storage_key_pub') == null || localStorage.getItem('storage_key_priv') == null) {
            await this.initStorage(key, iv);
        } else {
            await this.loadStorage(key, iv);
        }

        return JSON.parse(data);
    }

    public get isStorageInitialized(): boolean {
        return this.#isStorageInitialized;
    }

    public async updateEntry(key: string, value: string): Promise<void> {
        if (!this.isStorageInitialized || !this.#publicKey) throw new Error('Secure storage is not initialized!');
        this.#storage.set(key, value);
        this.#hasUpdate = true;
        if (this.#isStoring) return;
        while (this.#hasUpdate) {
            this.#hasUpdate = false;
            this.#isStoring = true;
            const storageData = JSON.stringify(Array.from(this.#storage.entries()));
            const encryptedData = await CryptoHelper.encryptRSA(this.#publicKey, storageData);
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
    }
}
