import * as t from 'io-ts';
import { chain } from 'fp-ts/Either';
import { Base64 } from 'js-base64';
import { ErrorSerializer } from 'app/utils/error-serailizer';
import type { Constructor } from 'app/utils/mixin-helper';
import type { TokenOptionGroup } from 'app/data/token-option-group';

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

export const TokenOptionMixinDataDef = t.strict({
    type: t.string,
    id: t.number,
    name: t.string,
    description: DescriptionDef,
    tokenBalanceChange: t.number,
    isMigrating: t.union([t.boolean, t.undefined])
});

export type TokenOptionMixinData = t.TypeOf<typeof TokenOptionMixinDataDef>;

export interface ITokenOption extends TokenOptionMixinData {
    group: TokenOptionGroup;
    get prompt(): string;
}

export function TokenOptionMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements ITokenOption {
        type = '';
        id = -1;
        name = '';
        description = '';
        tokenBalanceChange = 0;
        isMigrating: boolean | undefined = undefined;
        _group: TokenOptionGroup | undefined = undefined;

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
