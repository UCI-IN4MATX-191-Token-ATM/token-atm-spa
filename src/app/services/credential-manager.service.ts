import { Injectable } from '@angular/core';
import type { TokenATMCredentials } from 'app/data/token-atm-credentials';
import { Base64 } from 'js-base64';

@Injectable({
    providedIn: 'root'
})
export class CredentialManagerService {
    private getStoredItem(key: string, isRequired = true): string {
        const result = localStorage.getItem(key);
        if (!isRequired) return result ?? '';
        if (result == null) throw new Error(`${key} not found in localStorage`);
        return result;
    }

    private async deriveAESKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const PBKDF2Key = await window.crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );
        return await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                hash: 'SHA-512',
                salt: salt,
                iterations: 100000
            },
            PBKDF2Key,
            {
                name: 'AES-GCM',
                length: 256
            },
            false,
            ['encrypt', 'decrypt']
        );
    }

    private async encrypt(key: CryptoKey, content: string, iv?: Uint8Array): Promise<[Uint8Array, Uint8Array]> {
        if (iv == undefined) iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedData = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            new TextEncoder().encode(content)
        );
        return [iv, new Uint8Array(encryptedData)];
    }

    private async decrypt(key: CryptoKey, encryptedData: Uint8Array, iv: Uint8Array): Promise<string> {
        return new TextDecoder().decode(
            await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encryptedData
            )
        );
    }

    public async storeCredentials(credentials: TokenATMCredentials, password: string): Promise<void> {
        const salt = window.crypto.getRandomValues(new Uint8Array(32));
        const key = await this.deriveAESKey(password, salt);
        const [iv, data] = await this.encrypt(key, JSON.stringify(credentials));
        localStorage.setItem('salt', Base64.fromUint8Array(salt));
        localStorage.setItem('iv', Base64.fromUint8Array(iv));
        localStorage.setItem('data', Base64.fromUint8Array(data));
    }

    public async retrieveCredentials(password: string): Promise<TokenATMCredentials> {
        const salt = new Uint8Array(Base64.toUint8Array(this.getStoredItem('salt')));
        const key = await this.deriveAESKey(password, salt);
        const iv = new Uint8Array(Base64.toUint8Array(this.getStoredItem('iv')));
        const encryptedData = new Uint8Array(Base64.toUint8Array(this.getStoredItem('data')));
        const data = await this.decrypt(key, encryptedData, iv);
        return JSON.parse(data);
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
