import { Injectable } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { WithdrawLabDataTokenOption } from 'app/token-options/withdraw-lab-data-token-option';
import { TokenOptionResolver } from './token-option-resolver';

@Injectable()
export class WithdrawLabDataTokenOptionResolver extends TokenOptionResolver<WithdrawLabDataTokenOption> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public resolve(group: TokenOptionGroup, data: any): WithdrawLabDataTokenOption {
        return WithdrawLabDataTokenOption.deserialize(group, data);
    }

    public get type(): string {
        return 'withdraw-lab-data';
    }
}
