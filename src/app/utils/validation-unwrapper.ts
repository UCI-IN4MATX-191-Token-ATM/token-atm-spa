import type * as t from 'io-ts';
import { isLeft } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';

export function unwrapValidation<T>(res: t.Validation<T>, errMsgHeader = 'Invalid data'): T {
    if (isLeft(res)) throw new Error(errMsgHeader + ': ' + PathReporter.report(res).join('\n'));
    return res.right;
}

export function unwrapValidationFunc<T>(
    func: (...args: unknown[]) => t.Validation<T>,
    errMsgHeader = 'Invalid data'
): (...args: unknown[]) => T {
    return (...args: unknown[]): T => {
        return unwrapValidation(func(...args), errMsgHeader);
    };
}
