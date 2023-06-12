import { Injectable } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { WithdrawLabSwitchTokenOption } from 'app/token-options/withdraw-lab-switch-token-option';
import { TokenOptionResolver } from './token-option-resolver';

@Injectable()
export class WithdrawLabSwitchTokenOptionResolver extends TokenOptionResolver<WithdrawLabSwitchTokenOption> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public resolve(group: TokenOptionGroup, data: any): WithdrawLabSwitchTokenOption {
        return WithdrawLabSwitchTokenOption.deserialize(group, data);
    }

    public get type(): string {
        return 'withdraw-lab-switch';
    }
}
