import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';

export const ModuleMixinDataDef = t.strict({
    moduleName: t.string,
    moduleId: t.string
});

export type ModuleMixinData = t.TypeOf<typeof ModuleMixinDataDef>;
export type RawModuleMixinData = t.OutputOf<typeof ModuleMixinDataDef>;

export type IModule = ModuleMixinData;

export function ModuleMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements IModule {
        moduleName = '';
        moduleId = '';
    };
}
