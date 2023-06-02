import { Injectable } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { BasicTokenOption } from 'app/token-options/basic-token-option';
import { TokenOptionResolver } from './token-option-resolver';

@Injectable()
export class BasicTokenOptionResolver extends TokenOptionResolver<BasicTokenOption> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public resolve(group: TokenOptionGroup, data: any): BasicTokenOption {
        return BasicTokenOption.deserialize(group, data);
    }
    public get type(): string {
        return 'basic';
    }
}
