import { Injectable } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { SpendForLabDataTokenOption } from 'app/token-options/spend-for-lab-data-token-option';
import { TokenOptionResolver } from './token-option-resolver';

@Injectable()
export class SpendForLabDataTokenOptionResolver extends TokenOptionResolver<SpendForLabDataTokenOption> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public resolve(group: TokenOptionGroup, data: any): SpendForLabDataTokenOption {
        return SpendForLabDataTokenOption.deserialize(group, data);
    }
    public get type(): string {
        return 'spend-for-lab-data';
    }
}
