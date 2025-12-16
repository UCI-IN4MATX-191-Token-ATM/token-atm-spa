import type { TokenOption } from 'app/token-options/token-option';
import { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';
import { MultipleSectionDateMatcher } from 'app/utils/multiple-section-date-matcher';
import { canvasReadableDate, type DateContext } from 'app/utils/readableDateFormat';

type HasStartTime = {
    startTime: Date | MultipleSectionDateMatcher;
};

export class StartTimeTransformer extends TokenOptionInstructionTransformer<HasStartTime> {
    public get infoDescription(): string {
        return 'Can Request From';
    }

    public process(tokenOptions: TokenOption[], context: DateContext): string[] {
        return tokenOptions.map((tokenOption) => {
            const convertedObject = this.validate(tokenOption);
            if (convertedObject == undefined) return '';
            const startTime = convertedObject.startTime;
            if (startTime instanceof Date) {
                return canvasReadableDate(startTime, context.timezone);
            } else {
                return startTime.toHTML(context);
            }
        });
    }

    public validate(tokenOption: TokenOption): HasStartTime | undefined {
        const value = (tokenOption as unknown as HasStartTime).startTime;
        return value != undefined && (value instanceof Date || value instanceof MultipleSectionDateMatcher)
            ? (tokenOption as unknown as HasStartTime)
            : undefined;
    }
}
