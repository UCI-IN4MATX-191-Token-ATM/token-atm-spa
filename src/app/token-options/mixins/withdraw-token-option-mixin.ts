import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';
import type { ITokenOption } from './token-option-mixin';
import { getterWrapper } from 'app/utils/io-ts-getter-wrapper';

export const WithdrawTokenOptionMixinDataDef = getterWrapper('withdrawTokenOptionId', t.number);

export type WithdrawTokenOptionMixinData = t.TypeOf<typeof WithdrawTokenOptionMixinDataDef>;

export interface IWithdrawTokenOption<T extends ITokenOption> extends WithdrawTokenOptionMixinData, ITokenOption {
    get hasWithdrawTokenOption(): boolean;
    get withdrawTokenOption(): T | undefined;
}

export function WithdrawTokenOptionMixin<T extends ITokenOption, TBase extends Constructor<ITokenOption>>(
    Base: TBase,
    validator: (v: unknown) => v is T
) {
    return class extends Base implements IWithdrawTokenOption<T> {
        private _withdrawTokenOptionId = -1;
        private _cachedWithdrawTokenOption?: T;
        private _isCachedWithdrawTokenOptionInitialized = false;

        public get withdrawTokenOptionId(): number {
            return this._withdrawTokenOptionId;
        }

        public set withdrawTokenOptionId(withdrawTokenId: number) {
            this._cachedWithdrawTokenOption = undefined;
            this._isCachedWithdrawTokenOptionInitialized = false;
            this._withdrawTokenOptionId = withdrawTokenId;
        }

        private initalizeWithdrawTokenOption() {
            if (this._isCachedWithdrawTokenOptionInitialized) return;
            this._isCachedWithdrawTokenOptionInitialized = true;
            const tokenOption = this.group.configuration.getTokenOptionById(this._withdrawTokenOptionId);
            if (tokenOption == undefined) {
                this._cachedWithdrawTokenOption = undefined;
                return;
            }
            if (!validator(tokenOption)) throw new Error('Invalid Token Option Type for Withdraw Token Option ID');
            this._cachedWithdrawTokenOption = tokenOption;
        }

        public get hasWithdrawTokenOption(): boolean {
            this.initalizeWithdrawTokenOption();
            return this._cachedWithdrawTokenOption != undefined;
        }

        public get withdrawTokenOption(): T | undefined {
            this.initalizeWithdrawTokenOption();
            return this._cachedWithdrawTokenOption;
        }
    };
}
