import type { TokenOption } from 'app/token-options/token-option';
import { TokenOptionInstructionGenerator } from './token-option-instruction-generator';
import type { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';

export class HTMLTableGenerator extends TokenOptionInstructionGenerator {
    constructor(private transformers: TokenOptionInstructionTransformer<object>[]) {
        super();
    }
    public process(tokenOptions: TokenOption[]): string {
        const values: [string, string[]][] = [];
        for (const transformer of this.transformers) {
            if (!transformer.hasValidTokenOption(tokenOptions)) continue;
            values.push([transformer.infoDescription, transformer.process(tokenOptions)]);
        }
        if (values.length == 0) return '';
        const rows: string[][] = [];
        for (let i = 0; i < tokenOptions.length; i++) {
            const row: string[] = [];
            for (let j = 0; j < values.length; j++) {
                const value = values[j]?.[1]?.[i];
                if (value == undefined) continue;
                row.push(value);
            }
            rows.push(row);
        }
        return [
            '<table>',
            '<thead>',
            '<tr>',
            ...values.map((entry) => `<th style="text-align: center;">${entry[0]}</th>`),
            '</tr>',
            '</thead>',
            '<tbody>',
            ...rows.map(
                (row) => `<tr>${row.map((entry) => `<td style="text-align: center;">${entry}</td>`).join('')}</tr>`
            ),
            '</tbody>',
            '</table>'
        ].join('');
    }
}
