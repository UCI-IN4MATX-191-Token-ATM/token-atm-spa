export class ErrorSerializer {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static serailize(err: any): string {
        let result = '';
        if (typeof err.isAxiosError == 'boolean' && err.isAxiosError) {
            result = JSON.stringify(err);
        } else result = err.toString();
        if (typeof err.stack != 'undefined') result = result + '\n' + err.stack;
        return result;
    }
}
