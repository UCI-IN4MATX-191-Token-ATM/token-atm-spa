import { Component, EventEmitter, Input, Output } from '@angular/core';
import type {
    ColDef,
    DisplayedColumnsChangedEvent,
    FirstDataRenderedEvent,
    ICellRendererParams,
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
            const colDef: ColDef<AGGridDataSource, GridViewDataPoint['value']> = {
                headerName: name,
                field: JSON.stringify([name, type]),
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
                    // TODO: custom formatting & sorting
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
