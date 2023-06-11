import type { TokenOptionGroup } from 'app/data/token-option-group';
import { TokenOption } from './token-option';

export class BasicTokenOption extends TokenOption {
    public get descriptiveName(): string {
        return 'Basic Request (Always approve; just for testing purpose)';
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(group: TokenOptionGroup, data: any): BasicTokenOption {
        return new BasicTokenOption(...super.resolveTokenOption(group, data));
    }
}
