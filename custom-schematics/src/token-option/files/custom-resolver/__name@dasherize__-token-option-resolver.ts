import type { TokenOptionGroup } from 'app/data/token-option-group';
import type { <%= classify(name) %>TokenOption } from './<%= dasherize(name) %>-token-option';
import type { ExtractFromDataType } from 'app/token-options/mixins/from-data-mixin';
import { TokenOptionResolver } from 'app/token-options/token-option-resolver';

@Injectable()
export class <%= classify(name) %>TokenOptionResolver extends TokenOptionResolver<<%= classify(name) %>TokenOption> {
    public resolve(group: TokenOptionGroup, data: unknown): <%= classify(name) %>TokenOption {
        throw new Error('Custom resolution logic for <%= dasherize(name) %>-token-option is not implemented!');
    }

    public construct(group: TokenOptionGroup, data: ExtractFromDataType<<%= classify(name) %>TokenOption>): <%= classify(name) %>TokenOption {
        throw new Error('Custom construction logic for <%= dasherize(name) %>-token-option is not implemented!');
    }

    public get type() {
        return '<%= dasherize(name) %>';
    }
}
