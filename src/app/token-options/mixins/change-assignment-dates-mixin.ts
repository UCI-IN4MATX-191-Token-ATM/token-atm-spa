import * as t from 'io-ts';
import type { Constructor } from 'app/utils/mixin-helper';
import type { IGridViewDataSource } from './grid-view-data-source-mixin';
import { DurationDataDef } from 'app/data/date-fns-duration';
import { formatDuration } from 'date-fns';

// TODO: Make this implementation subsume the existing Canvas Assignment Dates changers
const ChangeDateDataDef = t.union([DurationDataDef, t.null]);
const propsAndTypes = {
    unlockAtChange: ChangeDateDataDef,
    dueAtChange: ChangeDateDataDef,
    lockAtChange: ChangeDateDataDef
};

export const ChangeAssignmentDatesMixinDataDef = t.exact(t.partial(propsAndTypes));

export type ChangeAssignmentDatesMixinData = t.TypeOf<typeof ChangeAssignmentDatesMixinDataDef>;
export type RawChangeAssignmentDatesMixinData = t.OutputOf<typeof ChangeAssignmentDatesMixinDataDef>;

export type IChangeAssignmentDates = ChangeAssignmentDatesMixinData & IGridViewDataSource;

export function ChangeAssignmentDatesMixin<TBase extends Constructor<IGridViewDataSource>>(Base: TBase) {
    return class extends Base implements IChangeAssignmentDates {
        unlockAtChange: ChangeAssignmentDatesMixinData['unlockAtChange'] = undefined;
        dueAtChange: ChangeAssignmentDatesMixinData['dueAtChange'] = undefined;
        lockAtChange: ChangeAssignmentDatesMixinData['lockAtChange'] = undefined;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
            super(...args);
            this.registerDataPointSource(() =>
                this.unlockAtChange !== undefined
                    ? {
                          colName: 'Change Canvas Assignment/Quiz’s “Available From”',
                          type: 'string',
                          value: this.unlockAtChange == null ? 'Remove' : 'Add ' + formatDuration(this.unlockAtChange)
                      }
                    : undefined
            );
            this.registerDataPointSource(() =>
                this.dueAtChange !== undefined
                    ? {
                          colName: 'Change Canvas Assignment/Quiz’s “Due”',
                          type: 'string',
                          value: this.dueAtChange == null ? 'Remove' : 'Add ' + formatDuration(this.dueAtChange)
                      }
                    : undefined
            );
            this.registerDataPointSource(() =>
                this.lockAtChange !== undefined
                    ? {
                          colName: 'Change Canvas Assignment/Quiz’s “Available Until”',
                          type: 'string',
                          value: this.lockAtChange == null ? 'Remove' : 'Add ' + formatDuration(this.lockAtChange)
                      }
                    : undefined
            );
        }
    };
}
