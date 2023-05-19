export abstract class RequestHandlerGuard {
    public abstract check(onReject: (message: string) => Promise<void>): Promise<void>;
}
