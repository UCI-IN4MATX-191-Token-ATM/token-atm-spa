import type { TokenOptionGroup } from 'app/data/token-option-group';
import type { ExtractFromDataType } from 'app/token-options/mixins/from-data-mixin';
import type { TokenOption } from 'app/token-options/token-option';

export abstract class TokenOptionResolver<T extends TokenOption> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public abstract resolve(group: TokenOptionGroup, data: unknown): T;
    public abstract construct(group: TokenOptionGroup, data: ExtractFromDataType<T>): T;
    public abstract get type(): string;
}
