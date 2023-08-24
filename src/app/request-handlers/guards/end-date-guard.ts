import { compareDesc } from 'date-fns';
import { RequestHandlerGuard } from './request-handler-guard';

export class EndDateGuard extends RequestHandlerGuard {
    constructor(private submittedDate: Date, private endDate: Date) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        // TODO: Update reject message
        if (compareDesc(this.submittedDate, this.endDate) == -1) onReject('Request was submitted after the until date');
    }
}
