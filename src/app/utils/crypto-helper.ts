export class CryptoHelper {
    public static AES_IV_LENGTH = 12;

    public static async deriveAESKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
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

    public static async encryptAES(
        key: CryptoKey,
        content: string,
        iv?: Uint8Array
    ): Promise<[Uint8Array, Uint8Array]> {
        if (iv == undefined) iv = window.crypto.getRandomValues(new Uint8Array(CryptoHelper.AES_IV_LENGTH));
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

    public static async decryptAES(key: CryptoKey, encryptedData: Uint8Array, iv: Uint8Array): Promise<string> {
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
}
