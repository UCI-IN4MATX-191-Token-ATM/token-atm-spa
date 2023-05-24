import type { TokenOption } from 'app/token-options/token-option';
import { format } from 'date-fns';
import { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';

type HasStartTime = {
    startTime: Date;
};

export class StartTimeTransformer extends TokenOptionInstructionTransformer<HasStartTime> {
    public get infoDescription(): string {
        return 'Start At';
    }

    public process(tokenOptions: TokenOption[]): string[] {
        return tokenOptions.map((tokenOption) => {
            const convertedObject = this.validate(tokenOption);
            return convertedObject == undefined ? '' : format(convertedObject.startTime, 'MMM dd, yyyy kk:mm:ss');
        });
    }

    public validate(tokenOption: TokenOption): HasStartTime | undefined {
        const value = (tokenOption as unknown as HasStartTime).startTime;
        return value == undefined ? undefined : (tokenOption as unknown as HasStartTime);
    }
}
