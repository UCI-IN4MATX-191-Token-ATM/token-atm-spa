import type { TokenOptionGroup } from 'app/data/token-option-group';
import { TokenOption } from './token-option';

export abstract class WithdrawTokenOption<T> extends TokenOption {
    private _initialized = false;
    private _withdrawTokenOptionId: number;
    private _withdrawTokenOption?: T;

    constructor(
        group: TokenOptionGroup,
        type: string,
        id: number,
        name: string,
        description: string,
        tokenBalanceChange: number,
        isMigrating: boolean,
        withdrawTokenOptionId: number
    ) {
        super(group, type, id, name, description, tokenBalanceChange, isMigrating);
        this._withdrawTokenOptionId = withdrawTokenOptionId;
    }

    protected abstract validateTokenOptionType(tokenOption: TokenOption): boolean;

    private initialize() {
        if (this._initialized) return;
        this._initialized = true;
        const tokenOption = this.group.configuration.getTokenOptionById(this.withdrawTokenOptionId);
        if (!tokenOption || !this.validateTokenOptionType(tokenOption)) return;
        this._withdrawTokenOption = tokenOption as T;
    }

    public get withdrawTokenOption(): T | undefined {
        this.initialize();
        if (!this._withdrawTokenOption) return undefined;
        return this._withdrawTokenOption;
    }

    public get withdrawTokenOptionId(): number {
        return this._withdrawTokenOptionId;
    }

    public set withdrawTokenOptionId(withdrawTokenOptionId: number) {
        this._withdrawTokenOptionId = withdrawTokenOptionId;
        this._initialized = false;
        this.initialize();
    }

    public override toJSON(): object {
        return {
            ...super.toJSON(),
            withdraw_token_option_id: this.withdrawTokenOptionId
        };
    }

    protected static resolveWithdrawTokenOption(
        group: TokenOptionGroup,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any
    ): ConstructorParameters<typeof WithdrawTokenOption> {
        if (typeof data['withdraw_token_option_id'] != 'number') {
            throw new Error('Invalid data');
        }
        return [...super.resolveTokenOption(group, data), data['withdraw_token_option_id']];
    }
}
