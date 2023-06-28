import { stringify } from 'flatted';

export class ErrorSerializer {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static serailize(err: any): string {
        let result = 'toString() result: ' + err.toString() + '\n';
        result += 'JSON result: ' + stringify(err);
        return result;
    }
}
