import { compareDesc } from 'date-fns';
import { RequestHandlerGuard } from './request-handler-guard';

export class EndDateGuard extends RequestHandlerGuard {
    constructor(private submittedDate: Date, private endDate: Date) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        // Reject message should match message in multiple-section-end-date-guard.ts
        if (compareDesc(this.submittedDate, this.endDate) == -1) onReject('Request was submitted too late');
    }
}
