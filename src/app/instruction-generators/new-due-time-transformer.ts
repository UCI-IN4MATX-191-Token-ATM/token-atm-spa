import type { TokenOption } from 'app/token-options/token-option';
import { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';
import { MultipleSectionDateMatcher } from 'app/utils/multiple-section-date-matcher';
import { canvasReadableDate, type DateContext } from 'app/utils/readableDateFormat';

type HasNewDueTime = {
    newDueTime: Date | MultipleSectionDateMatcher;
};

export class NewDueTimeTransformer extends TokenOptionInstructionTransformer<HasNewDueTime> {
    public get infoDescription(): string {
        return 'Allows Submitting Canvas Assignment/Quiz Until'; // TODO: Phrasing may need more work
    }

    public process(tokenOptions: TokenOption[], context: DateContext): string[] {
        return tokenOptions.map((tokenOption) => {
            const convertedObject = this.validate(tokenOption);
            if (convertedObject == undefined) return '';
            const newDueTime = convertedObject.newDueTime;
            if (newDueTime instanceof Date) {
                return canvasReadableDate(newDueTime, context.timezone);
            } else {
                return newDueTime.toHTML(context);
            }
        });
    }

    public validate(tokenOption: TokenOption): HasNewDueTime | undefined {
        const value = (tokenOption as unknown as HasNewDueTime).newDueTime;
        return value != undefined && (value instanceof Date || value instanceof MultipleSectionDateMatcher)
            ? (tokenOption as unknown as HasNewDueTime)
            : undefined;
    }
}
