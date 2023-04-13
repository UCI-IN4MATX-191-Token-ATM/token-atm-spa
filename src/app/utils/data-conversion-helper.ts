export class DataConversionHelper {
    public static async convertAsyncIterableToList<T>(it: AsyncIterable<T>): Promise<T[]> {
        const result: T[] = [];
        for await (const data of it) {
            result.push(data);
        }
        return result;
    }
}
