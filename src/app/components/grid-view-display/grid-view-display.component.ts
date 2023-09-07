import { Component, EventEmitter, Input, Output } from '@angular/core';
import type {
    ColDef,
    DisplayedColumnsChangedEvent,
    FirstDataRenderedEvent,
    ICellRendererParams,
    INumberFilterParams,
    ValueFormatterParams
} from 'ag-grid-community';
import type { GridViewData, GridViewDataPoint } from 'app/token-options/mixins/grid-view-data-source-mixin';
import { format } from 'date-fns';

type AGGridDataSource = {
    [key in string]: GridViewDataPoint['value'];
};

@Component({
    selector: 'app-grid-view-display',
    templateUrl: './grid-view-display.component.html',
    styleUrls: ['./grid-view-display.component.sass']
})
export class GridViewDisplayComponent {
    gridViewColDef?: ColDef<AGGridDataSource, GridViewDataPoint['value']>[];
    gridViewData?: AGGridDataSource[];
    @Output() columnChange = new EventEmitter<DisplayedColumnsChangedEvent>();

    @Input() set data(data: [GridViewData[], string[]] | undefined) {
        this.gridViewColDef = undefined;
        this.gridViewData = undefined;
        if (!data) return;
        const [dataArray, colPreferences] = data;
        const columns: [string, string][] = [],
            colSet = new Set<string>();
        this.gridViewData = [];
        for (const data of dataArray) {
            const dataObj: AGGridDataSource = {};
            for (const entry of data.data) {
                const colIdentifier = JSON.stringify([entry.colName, entry.type]);
                dataObj[colIdentifier] = entry.value;
                if (colSet.has(colIdentifier)) continue;
                colSet.add(colIdentifier);
                columns.push([entry.colName, entry.type]);
            }
            this.gridViewData.push(dataObj);
        }
        this.gridViewColDef = columns.map(([name, type]) => {
            const fieldName = JSON.stringify([name, type]);
            const colDef: ColDef<AGGridDataSource, GridViewDataPoint['value']> = {
                headerName: name,
                field: fieldName,
                resizable: true,
                wrapHeaderText: true,
                wrapText: true,
                autoHeaderHeight: true,
                autoHeight: true,
                sortable: true,
                filter: true
            };
            switch (type) {
                case 'number': {
                    colDef.cellDataType = 'number';
                    break;
                }
                case 'percentage': {
                    colDef.cellDataType = 'number';
                    colDef.filterValueGetter = (params) => {
                        const value = params.data?.[fieldName];
                        if (value == undefined || typeof value != 'number') return undefined;
                        return Number((value * 100).toFixed(2));
                    };
                    colDef.valueFormatter = (
                        params: ValueFormatterParams<AGGridDataSource, GridViewDataPoint['value']>
                    ) => (typeof params.value == 'number' ? `${Number((params.value * 100).toFixed(2))}%` : '');
                    colDef.filterParams = <INumberFilterParams>{
                        allowedCharPattern: String.raw`\d\.%`,
                        numberParser: (text: string | null) => {
                            if (text == null) return null;
                            const value = parseFloat(text.replaceAll('%', ''));
                            if (Number.isNaN(value)) return null;
                            return value;
                        },
                        numberFormatter: (value: number | null) => {
                            if (value == null) return null;
                            return `${value}%`;
                        }
                    };
                    break;
                }
                case 'string': {
                    colDef.cellDataType = 'text';
                    break;
                }
                case 'html': {
                    colDef.cellRenderer = (params: ICellRendererParams) => params.value ?? '';
                    delete colDef.wrapText;
                    delete colDef.sortable;
                    delete colDef.filter;
                    break;
                }
                case 'date': {
                    colDef.cellDataType = 'date';
                    colDef.valueFormatter = (
                        params: ValueFormatterParams<AGGridDataSource, GridViewDataPoint['value']>
                    ) => (params.value instanceof Date ? format(params.value, 'MMM dd, yyyy HH:mm:ss') : '');
                    break;
                }
                case 'boolean': {
                    colDef.cellDataType = 'text';
                    colDef.valueFormatter = (
                        params: ValueFormatterParams<AGGridDataSource, GridViewDataPoint['value']>
                    ) => (params.value ? 'Yes' : 'No');
                    colDef.filterParams = {
                        maxNumConditions: 1,
                        filterOptions: [
                            'empty',
                            {
                                displayKey: 'customBooleanYes',
                                displayName: 'Yes',
                                predicate: (_: unknown, cellValue: unknown) => cellValue,
                                numberOfInputs: 0
                            },
                            {
                                displayKey: 'customBooleanNo',
                                displayName: 'No',
                                predicate: (_: unknown, cellValue: boolean) => !cellValue,
                                numberOfInputs: 0
                            }
                        ]
                    };
                    break;
                }
            }
            return colDef;
        });
        const colOrdering = new Map<string, number>(),
            colPrefSet = new Set(colPreferences);
        for (const [ind, v] of colPreferences.entries()) {
            colOrdering.set(v, ind);
        }
        this.gridViewColDef.sort(
            (a, b) => (colOrdering.get(a.headerName as string) ?? -1) - (colOrdering.get(b.headerName as string) ?? -1)
        );
        for (const colDef of this.gridViewColDef) {
            if (!colPrefSet.has(colDef.headerName as string)) colDef.hide = true;
        }
    }

    onFirstDataRendered(event: FirstDataRenderedEvent) {
        event.columnApi.autoSizeAllColumns();
    }
}
