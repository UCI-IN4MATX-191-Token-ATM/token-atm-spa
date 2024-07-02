import { Injectable } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { <%= classify(name) %>TokenOption } from './<%= dasherize(name) %>-token-option';
import type { ExtractFromDataType } from 'app/token-options/mixins/from-data-mixin';
import { TokenOptionResolver } from 'app/token-options/token-option-resolver';

@Injectable()
export class <%= classify(name) %>TokenOptionResolver extends TokenOptionResolver<<%= classify(name) %>TokenOption> {
    public resolve(group: TokenOptionGroup, data: unknown): <%= classify(name) %>TokenOption {
        // TODO-Now: implement custom token option resolution
        throw new Error('Custom resolution logic for <%= classify(name) %>TokenOption is not implemented!');
        const result = new <%= classify(name) %>TokenOption().fromRawData(data);
        result.group = group;
        return result;
    }

    public construct(group: TokenOptionGroup, data: ExtractFromDataType<<%= classify(name) %>TokenOption>): <%= classify(name) %>TokenOption {
        // TODO-Now: implement custom token option construction
        throw new Error('Custom construction logic for <%= classify(name) %>TokenOption is not implemented!');
        const result = new <%= classify(name) %>TokenOption().fromData(data);
        result.group = group;
        return result;
    }

    public get type() {
        return '<%= dasherize(name) %>';
    }
}
