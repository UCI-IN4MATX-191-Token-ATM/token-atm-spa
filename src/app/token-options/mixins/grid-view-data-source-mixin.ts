import { getterWrapper } from 'app/utils/io-ts-getter-wrapper';
import { DateDef, type Constructor } from 'app/utils/mixin-helper';
import * as t from 'io-ts';

export const GridViewDataPointDef = t.intersection([
    t.strict({
        colName: t.string
    }),
    t.union([
        t.strict({
            type: t.literal('number'),
            value: t.number
        }),
        t.strict({
            type: t.literal('percentage'),
            value: t.number
        }),
        t.strict({
            type: t.literal('date'),
            value: DateDef
        }),
        t.strict({
            type: t.literal('string'),
            value: t.string
        }),
        t.strict({
            type: t.literal('html'),
            value: t.string
        })
    ])
]);

export type GridViewDataPoint = t.TypeOf<typeof GridViewDataPointDef>;

export const GridViewDataDef = t.strict({
    default: t.string,
    data: t.array(GridViewDataPointDef)
});

export type GridViewData = t.TypeOf<typeof GridViewDataDef>;

export const GridViewDataSourceDataDef = getterWrapper('gridViewData', GridViewDataDef);

export type GridViewDataSourceData = t.TypeOf<typeof GridViewDataSourceDataDef>;

export interface IGridViewDataSource extends GridViewDataSourceData {
    registerDataPointSource(source: () => GridViewDataPoint | undefined): void;
    set defaultGridViewValue(defaultValue: string);
}

export function GridViewDataSourceMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements IGridViewDataSource {
        private _registeredDataPointSources: (() => GridViewDataPoint | undefined)[] = [];
        private _defaultGridViewValue = '';

        public registerDataPointSource(source: () => GridViewDataPoint | undefined): void {
            this._registeredDataPointSources.push(source);
        }

        public set defaultGridViewValue(defaultGridViewValue: string) {
            this._defaultGridViewValue = defaultGridViewValue;
        }

        public set gridViewData(_: GridViewData) {
            // TODO: support setter for individual GridViewData
        }

        public get gridViewData(): GridViewData {
            return {
                default: this._defaultGridViewValue,
                data: this._registeredDataPointSources
                    .map((source) => source())
                    .filter((v) => v != undefined) as GridViewDataPoint[]
            };
        }
    };
}
