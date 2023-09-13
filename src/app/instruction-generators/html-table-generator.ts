import type { TokenOption } from 'app/token-options/token-option';
import { TokenOptionInstructionGenerator } from './token-option-instruction-generator';
import type { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';
import {
    combineTableCellRenderOptions,
    convertTableCellRenderOptionsToCSS,
    type TableCellData,
    type TableCellRenderOptions
} from 'app/utils/table-cell-render-helper';

function castStringToTableCellData(value: string | TableCellData): TableCellData {
    return typeof value == 'string'
        ? {
              value: value
          }
        : value;
}

export class HTMLTableGenerator extends TokenOptionInstructionGenerator {
    constructor(private transformers: TokenOptionInstructionTransformer<object>[]) {
        super();
    }
    public process(tokenOptions: TokenOption[]): string {
        const values: [TableCellData, TableCellData[]][] = [];
        for (const transformer of this.transformers) {
            if (!transformer.hasValidTokenOption(tokenOptions)) continue;
            values.push([
                castStringToTableCellData(transformer.infoDescription),
                transformer.process(tokenOptions).map(castStringToTableCellData)
            ]);
        }
        if (values.length == 0) return '';
        const rows: TableCellData[][] = [];
        for (let i = 0; i < tokenOptions.length; i++) {
            const row: TableCellData[] = [];
            for (let j = 0; j < values.length; j++) {
                const value = values[j]?.[1]?.[i];
                if (value == undefined) continue;
                row.push(value);
            }
            rows.push(row);
        }
        const defaultRenderOption: TableCellRenderOptions = {
            textAlignment: 'center',
            paddingLeft: '0.25em',
            paddingRight: '0.25em'
        };
        return [
            '<table style="border: 1px solid black; border-collapse: collapse; overflow-x: auto">',
            '<thead>',
            '<tr>',
            ...values.map(
                (entry) =>
                    `<th style="border: 1px solid black; ${convertTableCellRenderOptionsToCSS(
                        combineTableCellRenderOptions(defaultRenderOption, entry[0].options)
                    )}">${entry[0].value}</th>`
            ),
            '</tr>',
            '</thead>',
            '<tbody>',
            ...rows.map(
                (row) =>
                    `<tr>${row
                        .map(
                            (entry) =>
                                `<td style="border: 1px solid black; ${convertTableCellRenderOptionsToCSS(
                                    combineTableCellRenderOptions(defaultRenderOption, entry.options)
                                )}">${entry.value}</td>`
                        )
                        .join('')}</tr>`
            ),
            '</tbody>',
            '</table>'
        ].join('');
    }
}
