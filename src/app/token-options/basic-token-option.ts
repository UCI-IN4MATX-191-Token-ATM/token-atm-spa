import { TokenOption } from './token-option';

export class BasicTokenOption extends TokenOption {
    public get descriptiveName(): string {
        return 'Basic Request (Always approve; just for testing purpose)';
    }
}
