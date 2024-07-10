export function countAndNoun(count: number, noun: string) {
    return `${count} ${pluralize(noun, count)}`;
}

export function pluralize(word: string, count: number): string {
    return word + (count === 1 ? '' : 's');
}

import { Pipe, type PipeTransform } from '@angular/core';
/*
 * Displays the count of an associated noun with proper pluralization
 * Takes a noun argument to pluralize.
 * Usage:
 *   count | noun:string
 * Example:
 *   {{ 2 | noun:'student' }}
 *   formats to: 2 students
 */
@Pipe({ name: 'countAndNoun' })
export class CountAndNounPipe implements PipeTransform {
    transform(count: number, noun: string): string {
        return countAndNoun(count, noun);
    }
}

/*
 * Pluralizes a word based on the supplied count
 * Takes a count argument to find the correct pluralization.
 * Usage:
 *   word | count:number
 * Example:
 *   {{ 'request' | count:3 }}
 *   formats to: 'requests'
 */
@Pipe({ name: 'pluralize' })
export class PluralizePipe implements PipeTransform {
    transform(word: string, count: number): string {
        return pluralize(word, count);
    }
}
