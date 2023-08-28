import type { TokenOption } from 'app/token-options/token-option';
import { format } from 'date-fns';
import { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';
import { MultipleSectionDateMatcher } from 'app/utils/multiple-section-date-matcher';

type HasNewDueTime = {
    newDueTime: Date | MultipleSectionDateMatcher;
};

export class NewDueTimeTransformer extends TokenOptionInstructionTransformer<HasNewDueTime> {
    public get infoDescription(): string {
        return 'Extend Assignment/Quiz Lock Date To';
    }

    public process(tokenOptions: TokenOption[]): string[] {
        return tokenOptions.map((tokenOption) => {
            const convertedObject = this.validate(tokenOption);
            if (convertedObject == undefined) return '';
            const newDueTime = convertedObject.newDueTime;
            if (newDueTime instanceof Date) {
                return format(newDueTime, 'MMM dd, yyyy kk:mm:ss');
            } else {
                return newDueTime.toHTML();
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
