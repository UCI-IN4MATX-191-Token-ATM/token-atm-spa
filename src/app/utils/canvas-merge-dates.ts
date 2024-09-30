import type { ChangeAssignmentDatesMixinData } from 'app/token-options/mixins/change-assignment-dates-mixin';
import { add, compareAsc, compareDesc, isEqual } from 'date-fns';

export type OverrideDate = Date | null;
export type OverrideDates = { unlockAt: OverrideDate; lockAt: OverrideDate; dueAt: OverrideDate };

/**
 * Merges two override dates into a single choice.
 * @param min (default: true) if true, return earliest date. if false, return latest date.
 * @param preserveDate (default: false) if true, returns the other date if one is null
 * @returns the merged date or null
 */
function mergeOverrideDate(a: OverrideDate, b: OverrideDate, min = true, preserveDate = false): OverrideDate {
    if (a == null && preserveDate) return b;
    if (b == null && preserveDate) return a;
    if (a == null || b == null) return null;
    if (min) {
        return compareDesc(a, b) == 1 ? a : b;
    } else {
        return compareAsc(a, b) == 1 ? a : b;
    }
}

/**
 * Reports the date comparisons between unlock, due, and lock dates.
 *
 * - `lowerBound` compares unlock and due, `-1` means due is before unlock
 * - `upperBound` compares due and lock, `-1` means lock is before due
 * - `endpoints` compares unlock and lock, `-1` means lock is before unlock
 *
 * `0`s mean the dates are equal, and `1`s mean the ordering is correct
 * @param param0 Override dates to check the boundaries of
 * @returns Object with the relevant boundary comparisons
 */
export function boundsCheck({ unlockAt, dueAt, lockAt }: OverrideDates) {
    const result: { lowerBound?: number; upperBound?: number; endpoints?: number } = {};
    if (unlockAt !== null && dueAt !== null) {
        result['lowerBound'] = compareDesc(unlockAt, dueAt);
    }
    if (lockAt !== null && dueAt !== null) {
        result['upperBound'] = compareDesc(dueAt, lockAt);
    }
    if (unlockAt !== null && lockAt !== null) {
        result['endpoints'] = compareDesc(unlockAt, lockAt);
    }
    return result;
}

/**
 * @returns true if both dates are equal or both are null
 */
export function isOverrideDateEqual(a: OverrideDate, b: OverrideDate): boolean {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    return isEqual(a, b);
}

/**
 * @returns true if each pair of dates are equal (either same date or both null)
 */
export function areOverrideDatesEqual(a: OverrideDates, b: OverrideDates): boolean {
    return (
        isOverrideDateEqual(a.unlockAt, b.unlockAt) &&
        isOverrideDateEqual(a.dueAt, b.dueAt) &&
        isOverrideDateEqual(a.lockAt, b.lockAt)
    );
}

/**
 * Merges unlock, due, and lock dates.
 * Due at and Lock at use the latest date. Unlock at uses the earliest.
 * Null is basically both +∞ and -∞.
 *
 * @param preserveDate (default: false) will prioritize preserving dates (if true) or returning nulls (if false) for all override dates
 * @param skipMerging configure if merging should be skipped for the specified override dates (returns the value of the `a` argument instead)
 * @returns object with merged date results
 */
export function mergeOverrideDates(
    a: OverrideDates,
    b: OverrideDates,
    preserveDate = false,
    skipMerging: { [key in keyof OverrideDates]?: boolean } = {}
): OverrideDates {
    return {
        unlockAt: skipMerging?.unlockAt ? a.unlockAt : mergeOverrideDate(a.unlockAt, b.unlockAt, true, preserveDate), // Merges to earliest unlock date
        dueAt: skipMerging?.dueAt ? a.dueAt : mergeOverrideDate(a.dueAt, b.dueAt, false, preserveDate), // Merges to latest due date
        lockAt: skipMerging?.lockAt ? a.lockAt : mergeOverrideDate(a.lockAt, b.lockAt, false, preserveDate) // Merges to latest lock date
    };
}

export type CheckAndCollect = { name: string; predicate: () => boolean; result: () => Promise<OverrideDates> };

/**
 * Takes a Priority Ordered (highest to lowest) array and finds the first appropriate level.
 *
 * @returns The first option with a true predicate is returned. If none found, returns undefined.
 */
export function mostSpecificDateSource(levels: CheckAndCollect[]) {
    return levels.find((level) => level?.predicate?.());
}

/**
 * Provides default structure that properly resolves the final override dates for a student.
 * Attempts to follow the way Canvas works.
 *
 * Also allows levels to be skipped (for testing and audit purposes)
 *
 * @param individualOverridesWithThisStudent passing an empty array skips this level
 * @param sectionOverridesWithThisStudent passing an empty array skips this level
 * @param getAssignmentDates passing undefined skips this level
 * @returns Array of objects used to resolve and collect the override dates for a student
 */
export function defaultCanvasDateLevels(
    individualOverridesWithThisStudent: OverrideDates[],
    sectionOverridesWithThisStudent: OverrideDates[],
    getAssignmentDates?: () => Promise<OverrideDates>
) {
    let result: [CheckAndCollect, CheckAndCollect] | [CheckAndCollect, CheckAndCollect, CheckAndCollect] = [
        {
            name: 'Individual Level',
            predicate: () => {
                const numIndividualOverrides = individualOverridesWithThisStudent.length;
                if (numIndividualOverrides > 1) {
                    throw new Error(
                        'This student was found in multiple individual level overrides for this assignment. They should only ever be in one per assignment.'
                    );
                }
                return numIndividualOverrides === 1;
            },
            result: async () => {
                return (individualOverridesWithThisStudent as OverrideDates[]).reduce((acc, cur) =>
                    mergeOverrideDates(acc, cur)
                );
            }
        },
        {
            name: 'Section Level',
            predicate: () => {
                return sectionOverridesWithThisStudent.length > 0;
            },
            result: async () => {
                return (sectionOverridesWithThisStudent as OverrideDates[]).reduce((acc, cur) =>
                    mergeOverrideDates(acc, cur)
                );
            }
        }
    ];

    if (getAssignmentDates != null) {
        result = [
            ...result,
            {
                name: 'Assignment Level',
                predicate: () => {
                    return true;
                },
                result: async () => {
                    return await getAssignmentDates();
                }
            }
        ];
    }
    return result;
}

/**
 *
 * @param src The source Override Dates to change
 * @param change The changes to make (either add duration or make null)
 * @returns Override Dates object with the supplied changes
 */
export function changeOverrideDates(src: OverrideDates, change: ChangeAssignmentDatesMixinData): OverrideDates {
    const changeFunc = (dateType: keyof OverrideDates) => {
        const s = src[dateType];
        const c = change[`${dateType}Change`];
        return s === null || c === undefined ? s : c === null ? null : add(s, c);
    };

    return { unlockAt: changeFunc('unlockAt'), dueAt: changeFunc('dueAt'), lockAt: changeFunc('lockAt') };
}

/**
 *
 * @param src The source Override Dates to replace
 * @param replace The replacements to make (either a new or an existing Override Date)
 * @returns Override Dates object with the supplied replacements
 */
export function replaceOverrideDates(
    src: OverrideDates,
    replace: { [k in keyof ChangeAssignmentDatesMixinData]: keyof OverrideDates | OverrideDate }
): OverrideDates {
    const replaceFunc = (dateType: keyof OverrideDates) => {
        const s = src[dateType];
        const c = replace[`${dateType}Change`];
        return typeof c === 'string' ? src[c] : c === undefined ? s : c;
    };

    return { unlockAt: replaceFunc('unlockAt'), dueAt: replaceFunc('dueAt'), lockAt: replaceFunc('lockAt') };
}

/**
 * Canvas allows invalid ordered dates to be applied to learning objects. This function does its
 * best to transparently make a reasonable choice.
 *
 * Note: The worst edge case is when the unlock date is after the lock date. The decision here made
 * here is to make both the same datetime. A manual instructor correction is required to fix this outcome.
 *
 * @param result the Override Dates to check and fix the boundaries of
 * @param preserveLocks (default: true) if false, return the least restrictive fix
 * @returns The same result object if there are no boundary errors, otherwise the best fix
 */
export function checkAndFixBoundaries(result: OverrideDates, preserveLocks = true): OverrideDates {
    const { lowerBound, upperBound, endpoints } = boundsCheck(result);
    if (lowerBound !== -1 && upperBound !== -1 && endpoints !== -1) return result;

    // Endpoints are improperly ordered dates
    if (endpoints === -1) {
        // Set them both to latest date
        const latestDatetime = preserveLocks
            ? mergeOverrideDate(result.unlockAt, result.lockAt, false, true)
            : Object.values(result).reduce((a, c) => mergeOverrideDate(a, c, false, true));
        // Keep dueAt the same if it is null
        return replaceOverrideDates(result, {
            unlockAtChange: latestDatetime,
            dueAtChange: result.dueAt === null ? undefined : latestDatetime,
            lockAtChange: latestDatetime
        });
    }
    // Endpoints will not be improperly ordered, so only need to fix either a lowerBound or upperBound error
    if (lowerBound === -1) {
        return replaceOverrideDates(result, {
            dueAtChange: preserveLocks ? 'unlockAt' : undefined,
            unlockAtChange: preserveLocks ? undefined : 'dueAt'
        });
        /* upperBound === -1*/
    } else {
        return replaceOverrideDates(result, {
            dueAtChange: preserveLocks ? 'lockAt' : undefined,
            lockAtChange: preserveLocks ? undefined : 'dueAt'
        });
    }
}
