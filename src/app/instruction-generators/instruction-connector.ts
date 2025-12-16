import type { TokenOption } from 'app/token-options/token-option';
import { TokenOptionInstructionGenerator } from './token-option-instruction-generator';
import type { DateContext } from 'app/utils/readableDateFormat';

export class InstructionConnector extends TokenOptionInstructionGenerator {
    constructor(private generators: TokenOptionInstructionGenerator[], private separator = '') {
        super();
    }

    public process(tokenOptions: TokenOption[], context: DateContext): string {
        return this.generators.map((generator) => generator.process(tokenOptions, context)).join(this.separator);
    }
}
