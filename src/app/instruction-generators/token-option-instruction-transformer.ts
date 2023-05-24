import type { TokenOption } from 'app/token-options/token-option';

export abstract class TokenOptionInstructionTransformer<S> {
    public abstract process(tokenOptions: TokenOption[]): string[];

    public abstract validate(tokenOption: TokenOption): S | undefined;

    public abstract get infoDescription(): string;

    public hasValidTokenOption(tokenOptions: TokenOption[]): boolean {
        if (tokenOptions.length == 0) return false;
        for (const tokenOption of tokenOptions) {
            if (this.validate(tokenOption) == undefined) return false;
        }
        return true;
    }
}
