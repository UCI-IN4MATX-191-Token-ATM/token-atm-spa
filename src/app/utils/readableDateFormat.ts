import { format } from 'date-fns';
import { tz } from '@date-fns/tz';

const FORMAT_STRING = 'MMM dd, yyyy HH:mm:ss' as const;

/**
 * Context needed to properly define a readable date
 *
 * timezone Time zone name (IANA or UTC offset)
 */
export type DateContext = {
    timezone: string;
};

/**
 * Returns default consistent human readable date format
 * @param date `date-fns` supported date
 * @param timezone Time zone name (IANA or UTC offset)
 */
export function readableDate(
    date: Parameters<typeof format>[0],
    timezone?: Parameters<typeof tz>[0]
): ReturnType<typeof format> {
    return format(date, FORMAT_STRING, timezone === undefined ? timezone : { in: tz(timezone) });
}

/**
 * Returns default consistent human readable date format
 * - Used for student facing displays on Canvas (where a timezone is required)
 * @param date `date-fns` supported date
 * @param timezone Time zone name (IANA or UTC offset)
 */
export function canvasReadableDate(
    date: Parameters<typeof readableDate>[0],
    timezone: Parameters<typeof tz>[0]
): ReturnType<typeof readableDate> {
    return readableDate(date, timezone);
}
