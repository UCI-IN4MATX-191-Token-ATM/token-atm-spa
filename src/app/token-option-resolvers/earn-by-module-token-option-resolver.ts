import { Injectable } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { EarnByModuleTokenOption } from 'app/token-options/earn-by-module-token-option';
import { TokenOptionResolver } from './token-option-resolver';

@Injectable()
export class EarnByModuleTokenOptionResolver extends TokenOptionResolver<EarnByModuleTokenOption> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public resolve(group: TokenOptionGroup, data: any): EarnByModuleTokenOption {
        return EarnByModuleTokenOption.deserialize(group, data);
    }
    public get type(): string {
        return 'earn-by-module';
    }
}
