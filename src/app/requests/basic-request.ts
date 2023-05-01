import type { BasicTokenOption } from 'app/token-options/basic-token-option';
import { TokenATMRequest } from './token-atm-request';

export class BasicRequest extends TokenATMRequest<BasicTokenOption> {}
