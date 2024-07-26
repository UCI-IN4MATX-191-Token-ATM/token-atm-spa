import type { TokenOption } from 'app/token-options/token-option';
import { format } from 'date-fns';
import { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';
import { MultipleSectionDateMatcher } from 'app/utils/multiple-section-date-matcher';

type HasStartTime = {
    startTime: Date | MultipleSectionDateMatcher;
};

export class StartTimeTransformer extends TokenOptionInstructionTransformer<HasStartTime> {
    public get infoDescription(): string {
        return 'Can Request From';
    }

    public process(tokenOptions: TokenOption[]): string[] {
        return tokenOptions.map((tokenOption) => {
            const convertedObject = this.validate(tokenOption);
            if (convertedObject == undefined) return '';
            const startTime = convertedObject.startTime;
            if (startTime instanceof Date) {
                return format(startTime, 'MMM dd, yyyy HH:mm:ss');
            } else {
                return startTime.toHTML();
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
