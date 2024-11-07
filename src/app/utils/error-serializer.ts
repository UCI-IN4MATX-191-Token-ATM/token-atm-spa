import { stringify } from 'flatted';

export class ErrorSerializer {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static serialize(err: any): string {
        let result = '\ntoString() result: \n' + err.toString();
        if (err.cause != null) result += `\nCause: ` + err.cause.toString();
        result += '\nJSON result: \n' + stringify(err);
        if (err.cause != null) result += `\nCause: ` + stringify(err.cause);
        return result;
    }
}
