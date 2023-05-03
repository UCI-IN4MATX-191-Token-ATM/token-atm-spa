import type { TokenOptionGroup } from 'app/data/token-option-group';
import type { TokenOption } from 'app/token-options/token-option';

export abstract class TokenOptionResolver<T extends TokenOption> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public abstract resolve(group: TokenOptionGroup, data: any): T;
    public abstract get type(): string;
}
