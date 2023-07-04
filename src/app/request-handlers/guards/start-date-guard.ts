import { compareAsc } from 'date-fns';
import { RequestHandlerGuard } from './request-handler-guard';

export class StartDateGuard extends RequestHandlerGuard {
    constructor(private submittedDate: Date, private startDate: Date) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        if (compareAsc(this.submittedDate, this.startDate) == -1)
            onReject('Request was submitted before the start date');
    }
}
