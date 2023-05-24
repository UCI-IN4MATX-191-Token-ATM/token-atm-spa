import type { TokenOption } from 'app/token-options/token-option';
import { format } from 'date-fns';
import { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';

type HasDueTime = {
    dueTime: Date;
};

export class DueTimeTransformer extends TokenOptionInstructionTransformer<HasDueTime> {
    public get infoDescription(): string {
        return 'Due At';
    }

    public process(tokenOptions: TokenOption[]): string[] {
        return tokenOptions.map((tokenOption) => {
            const convertedObject = this.validate(tokenOption);
            return convertedObject == undefined ? '' : format(convertedObject.dueTime, 'MMM dd, yyyy kk:mm:ss');
        });
    }

    public validate(tokenOption: TokenOption): HasDueTime | undefined {
        const value = (tokenOption as unknown as HasDueTime).dueTime;
        return value == undefined ? undefined : (tokenOption as unknown as HasDueTime);
    }
}
