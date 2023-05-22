import type { TokenOption } from 'app/token-options/token-option';
import { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';

type HasTokenBalanceChange = {
    tokenBalanceChange: number;
};

export class TokenBalanceChangeTransformer extends TokenOptionInstructionTransformer<HasTokenBalanceChange> {
    public get infoDescription(): string {
        return 'Token Balance Change';
    }

    public process(tokenOptions: TokenOption[]): string[] {
        return tokenOptions.map((tokenOption) => this.validate(tokenOption)?.tokenBalanceChange?.toString() ?? '');
    }

    public validate(tokenOption: TokenOption): HasTokenBalanceChange | undefined {
        const value = (tokenOption as unknown as HasTokenBalanceChange).tokenBalanceChange;
        return value == undefined ? undefined : (tokenOption as unknown as HasTokenBalanceChange);
    }
}
