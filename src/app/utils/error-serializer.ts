import { stringify } from 'flatted';

export class ErrorSerializer {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static serialize(err: any): string {
        let result = '\ntoString() result: \n' + err.toString();
        result += '\nJSON result: \n' + stringify(err);
        return result;
    }
}
