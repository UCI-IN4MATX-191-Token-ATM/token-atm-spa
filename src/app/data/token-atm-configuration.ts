import type { Course } from './course';
import type { TokenOption } from '../token-options/token-option';
import { TokenOptionGroup } from './token-option-group';
import type { StudentRecord } from './student-record';
import { CryptoHelper } from 'app/utils/crypto-helper';
import { Base64 } from 'js-base64';
import { TypedArrayHelper } from 'app/utils/typed-array-helper';
import { compress, decompress } from 'compress-json';
import { generateRandomString } from 'app/utils/random-string-generator';

export class TokenATMConfiguration {
    private _course: Course;
    private _logAssignmentId: string;
    private _uid: string;
    private _suffix: string;
    private _description: string;
    private _nextFreeTokenOptionGroupId: number;
    private _nextFreeTokenOptionId: number;
    private _tokenOptionGroups: TokenOptionGroup[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _tokenOptionResolver: (group: TokenOptionGroup, data: any) => TokenOption;
    #encryptionPassword: string;
    #encryptionSalt: Uint8Array;
    #encryptionKey?: CryptoKey;

    constructor(
        course: Course,
        logAssignmentId: string,
        uid: string,
        suffix: string,
        description: string,
        nextFreeTokenOptionGroupId: number,
        nextFreeTokenOptionId: number,
        tokenOptionGroups: TokenOptionGroup[],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tokenOptionResolver: (group: TokenOptionGroup, data: any) => TokenOption,
        encryptionPassword: string,
        encryptionSalt: Uint8Array
    ) {
        this._course = course;
        this._logAssignmentId = logAssignmentId;
        this._uid = uid;
        this._suffix = suffix;
        this._description = description;
        this._nextFreeTokenOptionGroupId = nextFreeTokenOptionGroupId;
        this._nextFreeTokenOptionId = nextFreeTokenOptionId;
        this._tokenOptionGroups = tokenOptionGroups;
        this._tokenOptionResolver = tokenOptionResolver;
        this.#encryptionPassword = encryptionPassword;
        this.#encryptionSalt = encryptionSalt;
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

    public set uid(uid: string) {
        this._uid = uid;
    }

    public get suffix(): string {
        return this._suffix;
    }

    public set suffix(suffix: string) {
        this._suffix = suffix;
    }

    public get description(): string {
        return this._description;
    }

    public set description(description: string) {
        this._description = description;
    }

    public get tokenOptionGroups(): TokenOptionGroup[] {
        return this._tokenOptionGroups;
    }

    protected set tokenOptionGroups(tokenOptionGroups: TokenOptionGroup[]) {
        this._tokenOptionGroups = tokenOptionGroups;
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

    public addTokenOptionGroup(group: TokenOptionGroup): void {
        this._nextFreeTokenOptionGroupId = Math.max(this._nextFreeTokenOptionGroupId, group.id) + 1;
        this._tokenOptionGroups.push(group);
    }

    public updateNextFreeTokenOptionId(usedTokenOptionId: number): void {
        this._nextFreeTokenOptionId = Math.max(this._nextFreeTokenOptionId, usedTokenOptionId) + 1;
    }

    public deleteTokenOptionGroup(group: TokenOptionGroup) {
        const index = this._tokenOptionGroups.indexOf(group);
        if (index == -1) throw new Error('Token option group does not exist');
        this._tokenOptionGroups.splice(index, 1);
    }

    public get nextFreeTokenOptionGroupId(): number {
        return this._nextFreeTokenOptionGroupId;
    }

    public get nextFreeTokenOptionId(): number {
        return this._nextFreeTokenOptionId;
    }

    public toJSON(): object {
        return {
            log_assignment_id: this.logAssignmentId,
            uid: this.uid,
            suffix: this.suffix,
            description: Base64.encode(this.description),
            next_free_token_option_group_id: this.nextFreeTokenOptionGroupId,
            next_free_token_option_id: this.nextFreeTokenOptionId,
            token_option_groups: this.tokenOptionGroups.map((entry) => entry.toJSON())
        };
    }

    public getSecureConfig(): object {
        return {
            password: this.#encryptionPassword,
            salt: Base64.fromUint8Array(this.#encryptionSalt)
        };
    }

    // Warning: This function will override previous secure config!
    public regenerateSecureConfig(): void {
        this.#encryptionKey = undefined;
        this.#encryptionPassword = generateRandomString(32);
        this.#encryptionSalt = window.crypto.getRandomValues(new Uint8Array(32));
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

    public static deserialize(
        course: Course,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        secureConfig: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tokenOptionResolver: (group: TokenOptionGroup, data: any) => TokenOption
    ): TokenATMConfiguration {
        if (
            typeof data['log_assignment_id'] != 'string' ||
            typeof data['uid'] != 'string' ||
            (typeof data['suffix'] != 'undefined' && typeof data['suffix'] != 'string') ||
            (typeof data['description'] != 'undefined' && typeof data['description'] != 'string') ||
            typeof data['next_free_token_option_group_id'] != 'number' ||
            typeof data['next_free_token_option_id'] != 'number' ||
            typeof data['token_option_groups'] != 'object' ||
            !Array.isArray(data['token_option_groups']) ||
            typeof secureConfig['password'] != 'string' ||
            typeof secureConfig['salt'] != 'string'
        )
            throw new Error('Invalid data');
        const configuration = new TokenATMConfiguration(
            course,
            data['log_assignment_id'],
            data['uid'],
            data['suffix'] ?? '',
            data['description'] ? Base64.decode(data['description']) : '',
            data['next_free_token_option_group_id'],
            data['next_free_token_option_id'],
            [],
            tokenOptionResolver,
            secureConfig['password'],
            Base64.toUint8Array(secureConfig['salt'])
        );
        configuration.tokenOptionGroups = data['token_option_groups'].map((entry) =>
            TokenOptionGroup.deserialize(configuration, entry)
        );
        return configuration;
    }
}
