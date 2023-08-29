export function countAndNoun(count: number, noun: string) {
    return `${count} ${pluralize(noun, count)}`;
}

export function pluralize(word: string, count: number): string {
    return word + (count == 1 ? '' : 's');
}
