import type { TokenOption } from 'app/token-options/token-option';
import { format } from 'date-fns';
import { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';

type HasNewDueTime = {
    newDueTime: Date;
};

export class NewDueTimeTransformer extends TokenOptionInstructionTransformer<HasNewDueTime> {
    public get infoDescription(): string {
        return 'Extend Assignment/Quiz Lock Date To';
    }

    public process(tokenOptions: TokenOption[]): string[] {
        return tokenOptions.map((tokenOption) => {
            const convertedObject = this.validate(tokenOption);
            return convertedObject == undefined ? '' : format(convertedObject.newDueTime, 'MMM dd, yyyy kk:mm:ss');
        });
    }

    public validate(tokenOption: TokenOption): HasNewDueTime | undefined {
        const value = (tokenOption as unknown as HasNewDueTime).newDueTime;
        return value == undefined ? undefined : (tokenOption as unknown as HasNewDueTime);
    }
}
