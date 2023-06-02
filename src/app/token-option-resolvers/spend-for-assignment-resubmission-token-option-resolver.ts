import { Injectable } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { SpendForAssignmentResubmissionTokenOption } from 'app/token-options/spend-for-assignment-resubmission-token-option';
import { TokenOptionResolver } from './token-option-resolver';

@Injectable()
export class SpendForAssignmentResubmissionTokenOptionResolver extends TokenOptionResolver<SpendForAssignmentResubmissionTokenOption> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public resolve(group: TokenOptionGroup, data: any): SpendForAssignmentResubmissionTokenOption {
        return SpendForAssignmentResubmissionTokenOption.deserialize(group, data);
    }
    public get type(): string {
        return 'spend-for-assignment-resubmission';
    }
}
