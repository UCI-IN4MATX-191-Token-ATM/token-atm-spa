import type { RequestHandlerGuard } from './request-handler-guard';

export class RequestHandlerGuardExecutor {
    private _isRejected: boolean;
    private _message?: string;

    constructor(private guards: RequestHandlerGuard[]) {
        this._isRejected = false;
    }

    public async check(): Promise<void> {
        const callback = async (message: string) => {
            this._isRejected = true;
            this._message = message;
        };
        for (const guard of this.guards) {
            await guard.check(callback);
            if (this._isRejected) return;
        }
    }

    public get isRejected(): boolean {
        return this._isRejected;
    }

    public get message(): string | undefined {
        return this._message;
    }
}
