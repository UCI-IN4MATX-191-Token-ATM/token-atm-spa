import type { AssignmentOverride } from 'app/data/assignment-override';
import { compareAsc, compareDesc, isEqual } from 'date-fns';

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
 * @returns true if both dates are equal or both are null
 */
function isOverrideDateEqual(a: OverrideDate, b: OverrideDate): boolean {
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

type CheckAndCollect = { name: string; predicate: () => boolean; result: () => Promise<OverrideDates> };

/**
 * Takes a Priority Ordered (highest to lowest) array and reduces it to single appropriate level.
 *
 * @returns The first non-null option with a true predicate is returned. If none found, returns null.
 */
export function mostSpecificDateSource(levels: (CheckAndCollect | null)[]) {
    return levels.reduce((choice, cur) => {
        if (choice == null && cur?.predicate()) {
            return cur;
        } else {
            return choice;
        }
    }, null);
}

/**
 * Provides default stucture that properly resolves the final override dates for a student.
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
    individualOverridesWithThisStudent: AssignmentOverride[],
    sectionOverridesWithThisStudent: AssignmentOverride[],
    getAssignmentDates?: () => Promise<OverrideDates>
) {
    let result: [CheckAndCollect, CheckAndCollect] | [CheckAndCollect, CheckAndCollect, CheckAndCollect] = [
        {
            name: 'Individual Level',
            predicate: () => {
                const numIndividOverrides = individualOverridesWithThisStudent.length;
                if (numIndividOverrides > 1) {
                    throw new Error(
                        'This student was found in multiple individual level overrides for this assignment. They should only ever be in one per assignment.'
                    );
                }
                return numIndividOverrides === 1;
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
