import { compareAsc } from 'date-fns';
import { RequestHandlerGuard } from './request-handler-guard';

export class StartDateGuard extends RequestHandlerGuard {
    constructor(private submittedDate: Date, private startDate: Date) {
        super();
    }

    public async check(onReject: (message: string) => Promise<void>): Promise<void> {
        if (compareAsc(this.submittedDate, this.startDate))
            onReject('Request is submitted earlier than the start date');
    }
}
