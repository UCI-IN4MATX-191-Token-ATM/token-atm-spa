import type * as t from 'io-ts';
import { TokenOptionMixin, TokenOptionMixinDataDef } from './mixins/token-option-mixin';
import type { IToJSON } from './mixins/to-json-mixin';
import type { IFromData } from './mixins/from-data-mixin';
import { GridViewDataSourceMixin } from './mixins/grid-view-data-source-mixin';

// export abstract class TokenOption {
//     private _group: TokenOptionGroup;
//     private _type: string;
//     private _id: number;
//     private _name: string;
//     private _description: string;
//     private _tokenBalanceChange: number;
//     private _isMigrating: boolean;

//     constructor(
//         group: TokenOptionGroup,
//         type: string,
//         id: number,
//         name: string,
//         description: string,
//         tokenBalanceChange: number,
//         isMigrating: boolean
//     ) {
//         this._group = group;
//         this._type = type;
//         this._id = id;
//         this._name = name;
//         this._description = description;
//         this._tokenBalanceChange = tokenBalanceChange;
//         this._isMigrating = isMigrating;
//     }

//     public get group(): TokenOptionGroup {
//         return this._group;
//     }

//     public set group(group: TokenOptionGroup) {
//         this._group = group;
//     }

//     public get type(): string {
//         return this._type;
//     }

//     protected set type(type: string) {
//         this._type = type;
//     }

//     public get id(): number {
//         return this._id;
//     }

//     protected set id(id: number) {
//         this._id = id;
//     }

//     public get name(): string {
//         return this._name;
//     }

//     public set name(name: string) {
//         this._name = name;
//     }

//     public get description(): string {
//         return this._description;
//     }

//     public set description(description: string) {
//         this._description = description;
//     }

//     public get tokenBalanceChange(): number {
//         return this._tokenBalanceChange;
//     }

//     public set tokenBalanceChange(tokenBalanceChange: number) {
//         this._tokenBalanceChange = tokenBalanceChange;
//     }

//     public set isMigrating(isMigrating: boolean) {
//         this._isMigrating = isMigrating;
//     }

//     public get isMigrating(): boolean {
//         return this._isMigrating;
//     }

//     public get prompt(): string {
//         return 'Request for ' + this.name;
//     }

//     public toJSON(): object {
//         return {
//             type: this.type,
//             id: this.id,
//             name: this.name,
//             description: Base64.encode(this.description),
//             token_balance_change: this.tokenBalanceChange,
//             is_migrating: this.isMigrating ? true : undefined
//         };
//     }

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     protected static resolveTokenOption(
//         group: TokenOptionGroup,
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         data: any
//     ): ConstructorParameters<typeof TokenOption> {
//         if (
//             typeof data['type'] != 'string' ||
//             typeof data['id'] != 'number' ||
//             typeof data['name'] != 'string' ||
//             (typeof data['description'] != 'undefined' && typeof data['description'] != 'string') ||
//             typeof data['token_balance_change'] != 'number' ||
//             (typeof data['is_migrating'] != 'undefined' && typeof data['is_migrating'] != 'boolean')
//         )
//             throw new Error('Invalid data');
//         return [
//             group,
//             data['type'],
//             data['id'],
//             data['name'],
//             data['description'] ? Base64.decode(data['description']) : '',
//             data['token_balance_change'],
//             data['is_migrating'] ?? false
//         ];
//     }
// }

export const TokenOptionDataDef = TokenOptionMixinDataDef;

export type TokenOptionData = t.TypeOf<typeof TokenOptionDataDef>;
export type RawTokenOptionData = t.OutputOf<typeof TokenOptionDataDef>;

export class ATokenOption extends TokenOptionMixin(GridViewDataSourceMixin(Object)) {}

export type TokenOption<T = unknown> = ATokenOption & IToJSON & IFromData<T>;

export type ExtractDataType<T> = T extends TokenOption<infer O> ? O : never;
