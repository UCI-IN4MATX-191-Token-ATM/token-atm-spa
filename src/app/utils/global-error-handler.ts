import type { ErrorHandler } from '@angular/core';
import { ErrorSerializer } from './error-serailizer';

export class GlobalErrorHandler implements ErrorHandler {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public handleError(error: any) {
        const win = window.open('about:blank', '_blank');
        if (win == null) {
            console.error('Create error report failed!');
            return;
        }
        win.document.open();
        win.document.write(
            `<head><title>Error Report</title></head><body>An Error occured. Sorry for the inconvenience. Error Message: <br/> ${ErrorSerializer.serailize(
                error
            )}</body>`
        );
        win.document.close();
    }
}
