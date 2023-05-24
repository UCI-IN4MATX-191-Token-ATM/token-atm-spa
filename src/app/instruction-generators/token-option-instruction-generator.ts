import type { TokenOption } from 'app/token-options/token-option';

export abstract class TokenOptionInstructionGenerator {
    public abstract process(tokenOptions: TokenOption[]): string;
}
