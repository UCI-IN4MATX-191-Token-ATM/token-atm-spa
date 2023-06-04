import type { TokenOptionGroup } from 'app/data/token-option-group';
import { TokenOption } from './token-option';

export class BasicTokenOption extends TokenOption {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static deserialize(group: TokenOptionGroup, data: any): BasicTokenOption {
        return new BasicTokenOption(...super.resolveTokenOption(group, data));
    }
}
