import type { TokenOption } from 'app/token-options/token-option';
import { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';
import type { TableCellData } from 'app/utils/table-cell-render-helper';

type Descriptable = {
    description: string;
};

export class DescriptionTransformer extends TokenOptionInstructionTransformer<Descriptable> {
    public get infoDescription(): string {
        return 'Description';
    }

    public process(tokenOptions: TokenOption[]): (string | TableCellData)[] {
        // return tokenOptions.map((tokenOption) => (this.validate(tokenOption)?.description ?? ''));
        return tokenOptions.map((tokenOption) => {
            const value = this.validate(tokenOption)?.description;
            if (value == undefined) return '';
            const result: TableCellData = {
                value: value,
                options: {
                    textAlignment: 'left',
                    minWidth: value.length < 30 ? `${value.length / 2 + 1}em` : '15em',
                    maxWidth: '30em'
                }
            };
            return result;
        });
    }

    public validate(tokenOption: TokenOption): Descriptable | undefined {
        const value = (tokenOption as unknown as Descriptable).description;
        return value == undefined ? undefined : (tokenOption as unknown as Descriptable);
    }
}
