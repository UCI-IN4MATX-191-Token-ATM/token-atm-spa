import type { TokenOption } from 'app/token-options/token-option';
import { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';

type Descriptable = {
    description: string;
};

export class DescriptionTransformer extends TokenOptionInstructionTransformer<Descriptable> {
    public get infoDescription(): string {
        return 'Description';
    }

    public process(tokenOptions: TokenOption[]): string[] {
        return tokenOptions.map((tokenOption) => this.validate(tokenOption)?.description ?? '');
    }

    public validate(tokenOption: TokenOption): Descriptable | undefined {
        const value = (tokenOption as unknown as Descriptable).description;
        return value == undefined ? undefined : (tokenOption as unknown as Descriptable);
    }
}
