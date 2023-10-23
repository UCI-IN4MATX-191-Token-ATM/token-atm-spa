import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';

export const ModuleMixinDataDef = t.strict({
    moduleName: t.string,
    moduleId: t.string
});

export type ModuleMixinData = t.TypeOf<typeof ModuleMixinDataDef>;
export type RawModuleMixinData = t.OutputOf<typeof ModuleMixinDataDef>;

export type IModule = ModuleMixinData & IGridViewDataSource;

export function ModuleMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IModule {
        moduleName = '';
        moduleId = '';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() => ({
                colName: 'Canvas Module Name',
                type: 'string',
                value: this.moduleName
            }));
        }
    };
}
