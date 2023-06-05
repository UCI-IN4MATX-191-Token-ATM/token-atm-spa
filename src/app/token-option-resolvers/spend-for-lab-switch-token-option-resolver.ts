import { Injectable } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { SpendForLabSwitchTokenOption } from 'app/token-options/spend-for-lab-switch-token-option';
import { TokenOptionResolver } from './token-option-resolver';

@Injectable()
export class SpendForLabSwitchTokenOptionResolver extends TokenOptionResolver<SpendForLabSwitchTokenOption> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public resolve(group: TokenOptionGroup, data: any): SpendForLabSwitchTokenOption {
        return SpendForLabSwitchTokenOption.deserialize(group, data);
    }
    public get type(): string {
        return 'spend-for-lab-switch';
    }
}
