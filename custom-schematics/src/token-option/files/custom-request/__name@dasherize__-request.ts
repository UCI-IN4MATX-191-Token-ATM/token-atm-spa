import { TokenATMRequest } from 'app/token-options/token-atm-request';
import type { <%= classify(name) %>TokenOption } from './<%= dasherize(name) %>-token-option';

export class <%= classify(name) %>Request extends TokenATMRequest<<%= classify(name) %>TokenOption> {}
