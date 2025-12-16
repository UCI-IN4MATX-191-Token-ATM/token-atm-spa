import type { TokenOption } from 'app/token-options/token-option';
import type { DateContext } from 'app/utils/readableDateFormat';

export abstract class TokenOptionInstructionGenerator {
    // Force the passing of context. Currently the only use of this class
    // is the html table generator, which requires the proper date context
    // to be passed in for the formatted tables to be correct.
    //   It is probably possible to make the date context optional if needed.
    //   Defaulting to the browser's timezone is reasonable for local use.
    //   But externally printed/displayed values need to match the course context
    public abstract process(tokenOptions: TokenOption[], context: DateContext): string;
}
