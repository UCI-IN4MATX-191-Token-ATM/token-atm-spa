import * as t from 'io-ts';
import { chain } from 'fp-ts/Either';
import { Base64 } from 'js-base64';
import { ErrorSerializer } from 'app/utils/error-serailizer';
import type { Constructor } from 'app/utils/mixin-helper';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

/**
 * The definition of `description` attribute of `TokenOptionMixinData`.
 * Encode string to its base64 value.
 * Decode string by considering the provided value as a base64 string and then decode it to its original form.
 * Specifically, `undefined` will be decoded to empty string.
 */
export const DescriptionDef = new t.Type<string, string | undefined, unknown>(
    'TokenOptionDescription',
    (v): v is string => typeof v == 'string',
    (v, ctx) => {
        if (v == undefined) return t.success('');
        return chain((v: string): t.Validation<string> => {
            try {
                const result = Base64.decode(v);
                return t.success(result);
            } catch (err: unknown) {
                return t.failure(v, ctx, ErrorSerializer.serailize(err));
            }
        })(t.string.validate(v, ctx));
    },
    (v) => Base64.encode(v)
);

/**
 * The definition of `TokenOptionMixinData`.
 */
export const TokenOptionMixinDataDef = t.strict({
    type: t.string,
    id: t.number,
    name: t.string,
    description: DescriptionDef,
    tokenBalanceChange: t.number,
    isMigrating: t.union([t.boolean, t.undefined])
});

/**
 * The compile-time type of `TokenOptionMixinData`.
 */
export type TokenOptionMixinData = t.TypeOf<typeof TokenOptionMixinDataDef>;

/**
 * The compile-time type of encoded form of `TokenOptionMixinData`.
 */
export type RawTokenOptionMixinData = t.OutputOf<typeof TokenOptionMixinDataDef>;

/**
 * The interface of `TokenOption`.
 */
export interface ITokenOption extends TokenOptionMixinData, IGridViewDataSource {
    group: TokenOptionGroup;
    get prompt(): string;
}

/**
 * The mixin function for `TokenOption`.
 * @param Base The base class that need to be mixined.
 * @returns The class constructed by mixining the Base class with `TokenOption`. The class will implement `ITokenOption`.
 */
export function TokenOptionMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements ITokenOption {
        type = '';
        id = -1;
        name = '';
        description = '';
        tokenBalanceChange = 0;
        isMigrating: boolean | undefined = undefined;
        _group: TokenOptionGroup | undefined = undefined;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'Group',
                type: 'string',
                value: this.group.name
            }));
            this.registerDataPointSource(() => ({
                colName: 'Type',
                type: 'string',
                value: this.type
            }));
            this.registerDataPointSource(() => ({
                colName: 'ID',
                type: 'number',
                value: this.id
            }));
            this.registerDataPointSource(() => ({
                colName: 'Name',
                type: 'string',
                value: this.name
            }));
            this.registerDataPointSource(() => ({
                colName: 'Token Balance Change',
                type: 'number',
                value: this.tokenBalanceChange
            }));
            this.registerDataPointSource(() => ({
                colName: 'Description',
                type: 'string',
                value: this.description
            }));
        }

        public set group(group: TokenOptionGroup) {
            this._group = group;
        }

        public get group(): TokenOptionGroup {
            if (!this._group) throw new Error('Token option group is not set yet!');
            return this._group;
        }

        public get prompt(): string {
            return 'Request for ' + this.name;
        }
    };
}
