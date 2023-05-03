import type { ProcessedRequest } from 'app/data/processed-request';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenATMRequest } from 'app/requests/token-atm-request';
import type { TokenOption } from 'app/token-options/token-option';

export abstract class RequestHandler<T extends TokenOption, R extends TokenATMRequest<T>> {
    public abstract handle(
        configuration: TokenATMConfiguration,
        studentRecord: StudentRecord,
        request: R
    ): Promise<ProcessedRequest>;
    public abstract get type(): string;
}
