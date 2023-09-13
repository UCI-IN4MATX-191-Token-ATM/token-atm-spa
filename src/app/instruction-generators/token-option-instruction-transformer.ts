import type { TokenOption } from 'app/token-options/token-option';
import type { TableCellData } from 'app/utils/table-cell-render-helper';

export abstract class TokenOptionInstructionTransformer<S> {
    public abstract process(tokenOptions: TokenOption[]): (string | TableCellData)[];

    public abstract validate(tokenOption: TokenOption): S | undefined;

    public abstract get infoDescription(): string | TableCellData;

    public hasValidTokenOption(tokenOptions: TokenOption[]): boolean {
        if (tokenOptions.length == 0) return false;
        for (const tokenOption of tokenOptions) {
            if (this.validate(tokenOption) != undefined) return true;
        }
        return false;
    }
}
