import type { TokenOption } from 'app/token-options/token-option';
import { format, isValid } from 'date-fns';
import { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';

type HasEndTime = {
    endTime: Date;
};

export class EndTimeTransformer extends TokenOptionInstructionTransformer<HasEndTime> {
    public get infoDescription(): string {
        return 'End At';
    }

    public process(tokenOptions: TokenOption[]): string[] {
        return tokenOptions.map((tokenOption) => {
            const convertedObject = this.validate(tokenOption);
            return convertedObject == undefined ? '' : format(convertedObject.endTime, 'MMM dd, yyyy kk:mm:ss');
        });
    }

    public validate(tokenOption: TokenOption): HasEndTime | undefined {
        const value = (tokenOption as unknown as HasEndTime).endTime;
        return value != undefined && isValid(value) ? (tokenOption as unknown as HasEndTime) : undefined;
    }
}
