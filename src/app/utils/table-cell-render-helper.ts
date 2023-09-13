export type TableCellRenderOptions = {
    textAlignment?: 'left' | 'center' | 'right';
    paddingLeft?: string;
    paddingRight?: string;
    minWidth?: string;
    maxWidth?: string;
};

export type TableCellData = {
    value: string;
    options?: TableCellRenderOptions;
};

export function combineTableCellRenderOptions(
    ...options: (TableCellRenderOptions | undefined)[]
): TableCellRenderOptions | undefined {
    return options.reduce((a, b) => ({ ...a, ...b }), <TableCellRenderOptions>{});
}

export function convertTableCellRenderOptionsToCSS(options?: TableCellRenderOptions) {
    if (!options) return '';
    const result = [];
    if (options.textAlignment != undefined) result.push(`text-align: ${options.textAlignment}`);
    if (options.paddingLeft != undefined) result.push(`padding-left: ${options.paddingLeft}`);
    if (options.paddingRight != undefined) result.push(`padding-right: ${options.paddingRight}`);
    if (options.minWidth != undefined) result.push(`min-width: ${options.minWidth}`);
    if (options.maxWidth != undefined) result.push(`max-width: ${options.maxWidth}`);
    result.push('');
    return result.join(';');
}
