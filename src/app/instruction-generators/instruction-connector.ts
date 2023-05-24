import type { TokenOption } from 'app/token-options/token-option';
import { TokenOptionInstructionGenerator } from './token-option-instruction-generator';

export class InstructionConnector extends TokenOptionInstructionGenerator {
    constructor(private generators: TokenOptionInstructionGenerator[], private separator = '') {
        super();
    }

    public process(tokenOptions: TokenOption[]): string {
        return this.generators.map((generator) => generator.process(tokenOptions)).join(this.separator);
    }
}
