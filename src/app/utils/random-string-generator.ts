// Ref: https://stackoverflow.com/a/47496558
export function generateRandomString(size: number): string {
    return [...Array(size)].map(() => Math.random().toString(36)[2] ?? '0').join('');
}
