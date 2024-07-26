import type { TokenOption } from 'app/token-options/token-option';
import { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';

type HasName = {
    name: string;
};

export class NameTransformer extends TokenOptionInstructionTransformer<HasName> {
    public get infoDescription(): string {
        return 'Requests You Can Make';
    }

    public process(tokenOptions: TokenOption[]): string[] {
        return tokenOptions.map((tokenOption) => this.validate(tokenOption)?.name ?? '');
    }

    public validate(tokenOption: TokenOption): HasName | undefined {
        const value = (tokenOption as unknown as HasName).name;
        return value == undefined ? undefined : (tokenOption as unknown as HasName);
    }
}
