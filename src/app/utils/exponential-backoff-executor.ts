export class ExponentialBackoffExecutor {
    public static async execute<T>(
        executor: () => Promise<T>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resultChecker: (result: T | undefined, err: any | undefined) => Promise<boolean> = async (_, err) =>
            err != undefined ? false : true,
        retryCnt = 5,
        startWaitTime = 250,
        growthRate = 2
    ): Promise<T> {
        let curRetryCnt = 0,
            curWaitTime = startWaitTime;
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
                if (error != undefined) {
                    throw error;
                } else {
                    return result as T;
                }
            } else if (curRetryCnt < retryCnt) {
                curRetryCnt++;
                console.log(`Retrying... wait for ${curWaitTime} ms`);
                await new Promise((resolve) => setTimeout(resolve, curWaitTime));
                curWaitTime *= growthRate;
            } else {
                if (error != undefined) {
                    throw error;
                } else {
                    throw new Error(`Result of exponential backoff execution does not pass the checker`);
                }
            }
        }
    }
}
