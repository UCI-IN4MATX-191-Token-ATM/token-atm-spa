export function countAndNoun(count: number, noun: string) {
    const pluralize = (word: string, count: number): string => {
        return word + (count == 1 ? '' : 's');
    };
    return `${count} ${pluralize(noun, count)}`;
}
