import { Injectable } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { WithdrawAssignmentResubmissionTokenOption } from 'app/token-options/withdraw-assignment-resubmission-token-option';
import { TokenOptionResolver } from './token-option-resolver';

@Injectable()
export class WithdrawAssignmentResubmissionTokenOptionResolver extends TokenOptionResolver<WithdrawAssignmentResubmissionTokenOption> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public resolve(group: TokenOptionGroup, data: any): WithdrawAssignmentResubmissionTokenOption {
        return WithdrawAssignmentResubmissionTokenOption.deserialize(group, data);
    }

    public get type(): string {
        return 'withdraw-assignment-resubmission';
    }
}
