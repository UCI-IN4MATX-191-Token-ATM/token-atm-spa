import { format } from 'date-fns';
import { tz } from '@date-fns/tz';

const FORMAT_STRING = 'MMM dd, yyyy HH:mm:ss' as const;

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
