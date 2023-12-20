import { Inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { first } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ExponentialBackoffExecutorService {
    constructor(@Inject(MatSnackBar) private snackBar: MatSnackBar) {}

    public async execute<T>(
        executor: () => Promise<T>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resultChecker: (result: T | undefined, err: any | undefined) => Promise<boolean> = async (_, err) =>
            err != undefined ? false : true,
        retryMessage?: string,
        retryCnt = 5,
        startWaitTime = 250,
        growthRate = 2
    ): Promise<T> {
        let curRetryCnt = 0,
            curWaitTime = startWaitTime,
            isRetryMessageDismissed = false;
        let snackBarRef: MatSnackBarRef<TextOnlySnackBar> | undefined = undefined;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            let result: T | undefined = undefined,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                error: any | undefined = undefined;
            try {
                result = await executor();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                error = err;
            }
            if (await resultChecker(result, error)) {
                if (snackBarRef && !isRetryMessageDismissed) snackBarRef.dismiss();
                if (error != undefined) {
                    throw error;
                } else {
                    return result as T;
                }
            } else if (curRetryCnt < retryCnt) {
                curRetryCnt++;
                console.log(`Retrying... Message: ${retryMessage}. Wait for ${curWaitTime} ms`);
                if (retryMessage) {
                    if (!snackBarRef || isRetryMessageDismissed) {
                        isRetryMessageDismissed = false;
                        snackBarRef = this.snackBar.open(retryMessage, 'Dismiss');
                        snackBarRef
                            .afterDismissed()
                            .pipe(first())
                            .subscribe(() => {
                                isRetryMessageDismissed = true;
                            });
                    }
                }
                await new Promise((resolve) => setTimeout(resolve, curWaitTime));
                curWaitTime *= growthRate;
            } else {
                if (snackBarRef && !isRetryMessageDismissed) snackBarRef.dismiss();
                if (error != undefined) {
                    throw error;
                } else {
                    throw new Error(`Result of exponential backoff execution does not pass the checker`);
                }
            }
        }
    }
}
