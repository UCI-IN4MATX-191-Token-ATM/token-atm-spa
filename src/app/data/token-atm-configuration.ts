import type { Course } from './course';
import type { TokenOption } from '../token-options/token-option';
import { TokenOptionGroup } from './token-option-group';
import type { StudentRecord } from './student-record';
import { CryptoHelper } from 'app/utils/crypto-helper';
import { Base64 } from 'js-base64';
import { TypedArrayHelper } from 'app/utils/typed-array-helper';
import { compress, decompress } from 'compress-json';

export class TokenATMConfiguration {
    private _course: Course;
    private _logAssignmentId: string;
    private _uid: string;
    private _suffix: string;
    private _description: string;
    private _tokenOptionGroups: TokenOptionGroup[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _tokenOptionResolver: (group: TokenOptionGroup, data: any) => TokenOption;
    #encryptionPassword: string;
    #encryptionSalt: Uint8Array;
    #encryptionKey?: CryptoKey;

    constructor(
        course: Course,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        secureConfig: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tokenOptionResolver: (group: TokenOptionGroup, data: any) => TokenOption
    ) {
        this._course = course;
        if (
            typeof data['log_assignment_id'] != 'string' ||
            typeof data['uid'] != 'string' ||
            (typeof data['suffix'] != 'undefined' && typeof data['suffix'] != 'string') ||
            (typeof data['description'] != 'undefined' && typeof data['description'] != 'string') ||
            typeof data['token_option_groups'] != 'object' ||
            !Array.isArray(data['token_option_groups']) ||
            typeof secureConfig['password'] != 'string' ||
            typeof secureConfig['salt'] != 'string'
        )
            throw new Error('Invalid data');
        this._logAssignmentId = data['log_assignment_id'];
        this._uid = data['uid'];
        this._suffix = data['suffix'] ?? '';
        this._description = data['description'] ?? '';
        this.#encryptionPassword = secureConfig['password'];
        this.#encryptionSalt = Base64.toUint8Array(secureConfig['salt']);
        this._tokenOptionResolver = tokenOptionResolver;
        this._tokenOptionGroups = data['token_option_groups'].map(
            (entry) => new TokenOptionGroup(this, entry, tokenOptionResolver)
        );
    }

    public get course(): Course {
        return this._course;
    }

    public get logAssignmentId(): string {
        return this._logAssignmentId;
    }

    public set logAssignmentId(logAssignmentId: string) {
        this._logAssignmentId = logAssignmentId;
    }

    public get uid(): string {
        return this._uid;
    }

    public get suffix(): string {
        return this._suffix;
    }

    public get description(): string {
        return this._description;
    }

    public get tokenOptionGroups(): TokenOptionGroup[] {
        return this._tokenOptionGroups;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public get tokenOptionResolver(): (group: TokenOptionGroup, data: any) => TokenOption {
        return this._tokenOptionResolver;
    }

    public getTokenOptionGroupById(id: number): TokenOptionGroup | undefined {
        // TODO: maintain a Map separately for better performance
        for (const group of this.tokenOptionGroups) if (group.id == id) return group;
        return undefined;
    }

    public getTokenOptionById(id: number): TokenOption | undefined {
        for (const group of this.tokenOptionGroups)
            for (const option of group.tokenOptions) if (option.id == id) return option;
        return undefined;
    }

    public addTokenOptionGroup(group: TokenOptionGroup) {
        this._tokenOptionGroups.push(group);
    }

    public deleteTokenOptionGroup(group: TokenOptionGroup) {
        const index = this._tokenOptionGroups.indexOf(group);
        if (index == -1) throw new Error('Token option group does not exist');
        this._tokenOptionGroups.splice(index, 1);
    }

    public getFreeTokenOptionGroupId(): number {
        const usedIds = new Set(this.tokenOptionGroups.map((entry) => entry.id));
        for (let id = 0; ; id++) {
            if (!usedIds.has(id)) return id;
        }
    }

    public getFreeTokenOptionId(): number {
        const usedIds = new Set();
        for (const group of this.tokenOptionGroups) {
            for (const tokenOption of group.tokenOptions) {
                usedIds.add(tokenOption.id);
            }
        }
        for (let id = 0; ; id++) {
            if (!usedIds.has(id)) return id;
        }
    }

    public toJSON(): object {
        return {
            log_assignment_id: this.logAssignmentId,
            uid: this.uid,
            suffix: this.suffix,
            description: this.description,
            token_option_groups: this.tokenOptionGroups.map((entry) => entry.toJSON())
        };
    }

    public getSecureConfig(): object {
        return {
            password: this.#encryptionPassword,
            salt: Base64.fromUint8Array(this.#encryptionSalt)
        };
    }

    async #generateKey(): Promise<void> {
        this.#encryptionKey = await CryptoHelper.deriveAESKey(this.#encryptionPassword, this.#encryptionSalt);
    }

    public async encryptStudentRecord(studentRecord: StudentRecord): Promise<string> {
        if (this.#encryptionKey == undefined) await this.#generateKey();
        if (this.#encryptionKey == undefined) throw new Error('AES encryption key generation failed');
        const transformedStudentRecord = JSON.parse(JSON.stringify(studentRecord));
        return Base64.fromUint8Array(
            TypedArrayHelper.contactUint8Array(
                ...(await CryptoHelper.encryptAES(
                    this.#encryptionKey,
                    JSON.stringify(compress(transformedStudentRecord))
                ))
            )
        );
    }

    public async decryptStudentRecord(encrpytedData: string): Promise<unknown> {
        if (this.#encryptionKey == undefined) await this.#generateKey();
        if (this.#encryptionKey == undefined) throw new Error('AES encryption key generation failed');
        const [iv, data] = TypedArrayHelper.splitUint8Array(
            Base64.toUint8Array(encrpytedData),
            CryptoHelper.AES_IV_LENGTH
        );
        return decompress(JSON.parse(await CryptoHelper.decryptAES(this.#encryptionKey, data, iv)));
    }
}
