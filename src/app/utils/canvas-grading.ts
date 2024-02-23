// type CanvasGradingTypes = 'pass_fail' | 'percent' | 'points';
// type UnsupportedGradingTypes = 'letter_grade' | 'gpa_scale';

import { pluralize } from './pluralize';

/**
 * Keys are grading types provided by Canvas.
 * Values are display names use in Canvas UI.
 */
export enum CanvasGradingType {
    pass_fail = 'Complete/Incomplete',
    percent = 'Percentage',
    points = 'Points',
    letter_grade = 'Letter Grade',
    gpa_scale = 'GPA Scale',
    not_graded = 'Not Graded'
}

// 'points' allows:
//      a number, which can be > assignment.points_possible

// 'percent' allows:
//      a number with a '%' appended, where 100% == assignment.points_possible
//                                    and >100% is possible

// 'pass_fail' allows:
//      'pass' or  'complete', which are converted to 100%
//      'fail' or 'incomplete, which are converted to a score of 0
//             a number      , only 0  or assignment.points_possible
//             a number + '%', only 0% or 100%

// N.B. for adding to a current score, only percent and points grading_type are supported
const MAX_DECIMALS = 2;

/**
 * Adds a percentage of the pointsPossible to the current grade, and returns new grade in same format as current.
 *
 * Only guaranteed to work for 'points' and 'percent' grading_type assignments.
 * @param additionalPercentage percentage to add in decimal number format
 * @param current string of the current grade/score on Canvas (e.g. '10' or '10%')
 * @param pointsPossible the denominator used for ratio conversions
 * @returns A string for the Canvas submission posted_grade
 */
export function addPercentToPointsOrPercentType(
    additionalPercentage: number,
    current: string,
    pointsPossible: number
): string {
    const cur = parseCanvasPercentsAndPoints(current);
    if (current.endsWith('%')) {
        const sum = additionalPercentage + cur;
        return convertNumberToMaxDecimalString(sum * 100) + '%';
    } else {
        const sum = additionalPercentage * pointsPossible + cur;
        return convertNumberToMaxDecimalString(sum);
    }
}

/**
 * Adds points to the current grade, and returns new grade in the same format as current.
 * Uses pointsPossible to convert to/from percentages, if needed.
 *
 * Only guaranteed to work for 'points' and 'percent' Canvas grading_type assignments.
 * @param additionalPoints points to add
 * @param current string of the current grade/score on Canvas (e.g. '10' or '10%')
 * @param pointsPossible the denominator used for ratio conversions
 * @returns A string for the Canvas submission posted_grade
 */
export function addPointsToPercentOrPointsType(
    additionalPoints: number,
    current: string,
    pointsPossible: number
): string {
    const cur = parseCanvasPercentsAndPoints(current);
    if (current.endsWith('%')) {
        const sum = additionalPoints / pointsPossible + cur;
        return convertNumberToMaxDecimalString(sum * 100) + '%';
    } else {
        const sum = additionalPoints + cur;
        return convertNumberToMaxDecimalString(sum);
    }
}

export type CanvasGradeScorePossible = {
    gradeType?: keyof typeof CanvasGradingType;
    grade: string | null;
    score: number | null;
    pointsPossible: number | null;
};
type FixedCanvasGradeScorePossible = {
    gradeType: 'percent' | 'points';
    grade: string;
    score: number;
    pointsPossible: number;
};
export type UpdatePostedGrade = { postedGrade: string; updateMessage: string };

/**
 * Generates strings used to update an existing Canvas Assignment grade.
 * - Assignments without submissions/grades are treated as having 0 point grades.
 * - Prioritizes adding whole integers whenever possible.
 * - Defaults to adding to the target's gradeType if a single best choice isn't available.
 * - If the target assignment is out of 0 points, forces the addition to be points based.
 * @param add Amount to add to assignment, can be number or percent (e.g. '10' or '10%')
 * @param target Grade details of target assignment submission
 * @param basedOn Optional denominator to scale percentages by
 * @returns postedGrade that is submitted to Canvas, and updateMessage for submission comment
 */
export function addPercentOrPointsToCanvasGrade(
    add: string,
    target: CanvasGradeScorePossible,
    basedOn?: number
): UpdatePostedGrade {
    if (target.gradeType == null) {
        throw new Error('Invalid data, can’t add points to an Assignment without a grading type');
    }
    const tar = normalizeGradeScorePossible(target);
    const postedGrade = decideNewPostedGrade(add, tar, basedOn);
    const updateMessage = generatePostedGradeMessage(add, tar, postedGrade, basedOn);
    return { postedGrade, updateMessage };
}
function normalizeGradeScorePossible(value: CanvasGradeScorePossible): FixedCanvasGradeScorePossible {
    const { gradeType, grade, score, pointsPossible } = value;
    if (gradeType == null || (gradeType !== 'percent' && gradeType !== 'points')) {
        throw new Error('Invalid data, cannot normalize grades for an assignment without an approved Grade Type');
    }
    return {
        gradeType,
        grade: grade ?? (!pointsPossible ? '0' : '0%'),
        score: score ?? 0,
        pointsPossible: pointsPossible ?? NaN
    };
}
type valueState = 'percent' | 'points';
function decideNewPostedGrade(add: string, target: FixedCanvasGradeScorePossible, basedOn?: number): string {
    const forcePointsResult = target.pointsPossible === 0;
    // If needed, scales addition to be in terms of target's points possible
    const scaledAdd = scaleAddAndMarkMorePreciseType(add, target, basedOn);
    const [toAdd, addTo, addTypeState] = decideWhatToAdd(forcePointsResult, scaledAdd, target);
    const addScoreFunc = addTypeState === 'points' ? addPointsToPercentOrPointsType : addPercentToPointsOrPercentType;
    const parsedAdd = parseCanvasPercentsAndPoints(toAdd);
    if (!Number.isFinite(parsedAdd)) {
        throw new Error(`Invalid number: ${toAdd} was parsed as ${parsedAdd}, which is not a number.`);
    }
    return addScoreFunc(parsedAdd, addTo, target.pointsPossible);
}
function scaleAddAndMarkMorePreciseType(add: string, target: FixedCanvasGradeScorePossible, conversionDenom?: number) {
    const { pointsPossible } = target;
    const addPercent = add.includes('%');
    const a = parseCanvasPercentsAndPoints(add);
    const percentResult = () => {
        if (addPercent) {
            if (conversionDenom == null) return Number.isNaN(pointsPossible) ? NaN : a * 100;
            else return ((a * conversionDenom) / pointsPossible) * 100;
        } else {
            return (a / pointsPossible) * 100;
        }
    };
    const rGrade = percentResult();
    const rScore = addPercent ? a * (conversionDenom ?? pointsPossible) : a;
    function findMorePreciseType(grade: number, score: number, attemptsLeft = MAX_DECIMALS + 2): valueState | null {
        const check = (v: number) => Number.isInteger(v) && v !== 0;
        if (attemptsLeft === 0) return null;
        const a = check(grade);
        const b = check(score);
        if (a !== b) {
            return a && check(grade) ? 'percent' : 'points';
        }
        return findMorePreciseType(grade * 10, score * 10, attemptsLeft - 1);
    }
    return {
        gradeType: (addPercent ? 'percent' : 'points') as valueState,
        grade: rGrade.toString(10) + '%',
        score: rScore,
        pointsPossible,
        mostPreciseType: findMorePreciseType(rGrade, rScore)
    };
}
function decideWhatToAdd(
    forcePointsResult: boolean,
    scaledAddInfo: FixedCanvasGradeScorePossible & { mostPreciseType: valueState | null },
    targetAddToInfo: FixedCanvasGradeScorePossible
): [string, string, valueState] {
    type errorState = valueState | 'both' | 'none';
    type validAdditions = { addGrade?: string; addScore?: string; errorState: errorState };
    function findValidValues(
        target: FixedCanvasGradeScorePossible,
        forceValueType?: valueState,
        keepPred = isFinite
    ): validAdditions {
        function errorState() {
            let errorType: errorState = 'none';
            return (e?: errorState) => {
                if (e !== undefined) {
                    switch (e) {
                        case 'none':
                            errorType = 'none';
                            break;
                        case 'both':
                            errorType = 'both';
                            break;
                        case 'percent':
                            if (errorType === 'both') break;
                            errorType = errorType === 'points' ? 'both' : e;
                            break;
                        case 'points':
                            if (errorType === 'both') break;
                            errorType = errorType === 'percent' ? 'both' : e;
                            break;
                    }
                }
                return errorType;
            };
        }
        const errorTracker = errorState();
        const { grade, score } = target;
        // Track what fails the predicate
        [grade, score.toString(10)].map((v) => (!keepPred(v) ? getType(v) : undefined)).forEach(errorTracker);
        errorTracker(forceValueType ? (forceValueType === 'percent' ? 'points' : 'percent') : undefined);
        // Grade must be a percent
        errorTracker(!grade.includes('%') ? 'percent' : undefined);
        const gNum = parseCanvasPercentsAndPoints(grade);
        // Both values should be zero or non-zero, otherwise drop the 0 valued type
        errorTracker(gNum === 0 && score !== 0 ? 'percent' : undefined);
        errorTracker(score === 0 && gNum !== 0 ? 'points' : undefined);
        if (errorTracker() === 'both') {
            return { errorState: errorTracker() };
        } else if (errorTracker() === 'none') {
            return { addScore: score.toString(10), addGrade: grade, errorState: errorTracker() };
        } else {
            return errorTracker() !== 'points'
                ? { addScore: score.toString(10), errorState: errorTracker() }
                : { addGrade: grade, errorState: errorTracker() };
        }
    }
    function isFinite(v: unknown) {
        return typeof v === 'string' ? !v.includes('NaN') && !v.includes('Infinity') : Number.isFinite(v);
    }
    function isInt(v: unknown) {
        return isFinite(v) && (typeof v === 'string' ? !v.includes('.') : Number.isInteger(v));
    }
    function getType(v: string): valueState {
        return v.includes('%') ? 'percent' : 'points';
    }
    function getValidType(v: validAdditions): errorState {
        if (v.errorState === 'none') return 'both';
        else if (v.errorState === 'both') return 'none';
        else if (v.errorState === 'percent') return 'points';
        /*v.errorState === 'points'*/ else return 'percent';
    }
    function getEqualType(v1: validAdditions, v2: validAdditions): errorState {
        const v1T = getValidType(v1);
        const v2T = getValidType(v2);
        if (v1T === 'none' || v2T === 'none') return 'none';
        else if (v1T === 'both') return v2T;
        else if (v2T === 'both') return v1T;
        else if (v1T === v2T) return v2T;
        else if (v1T !== v2T) return 'none';
        else throw new Error('Should be unreachable code.');
    }
    function singleBestAdd(v: validAdditions, prefer?: valueState): string | null | undefined {
        const valid = getValidType(v);
        if (valid === 'both') return prefer ? (prefer === 'percent' ? v.addGrade : v.addScore) ?? null : null;
        else if (valid === 'none') return undefined;
        else return (valid === 'percent' ? v.addGrade : v.addScore) ?? null;
    }
    const resolve = (keepPred = isInt): { addTo: string; toAdd: string } => {
        const { gradeType: originalAddType, mostPreciseType, pointsPossible: denom } = scaledAddInfo;
        const { gradeType: addToPreference } = targetAddToInfo;
        const toAddPreference = mostPreciseType ?? undefined;

        const validToAdds = findValidValues(scaledAddInfo, undefined, keepPred);
        const validAddTos = findValidValues(targetAddToInfo, forcePointsResult ? 'points' : undefined, keepPred);

        // If only one best option for each exists, use them
        let toAdd = singleBestAdd(validToAdds) ?? '';
        let addTo = singleBestAdd(validAddTos) ?? '';

        // If only integer values are valid...
        if (keepPred === isInt) {
            const intPair = getEqualType(validToAdds, validAddTos);
            // No matching int pairs, fallback to checking finite values instead of just ints
            if (intPair === 'none') ({ toAdd, addTo } = resolve(isFinite));
            else if (intPair !== 'both') {
                // If there is only a single way to add a pair of ints, use it
                [toAdd, addTo] =
                    intPair === 'percent'
                        ? [singleBestAdd(validToAdds, 'percent') ?? '', singleBestAdd(validAddTos, 'percent') ?? '']
                        : [singleBestAdd(validToAdds, 'points') ?? '', singleBestAdd(validAddTos, 'points') ?? ''];
            } else {
                // Nothing. Use same resolution code as finite values below
            }
        }

        // If the best choice for the addition value hasn't been found yet,
        // Prioritize by: 1) more precise addition value, then
        //                2) target assignment type, and finally
        //                3) type of addition originally provided
        if (!toAdd)
            toAdd =
                singleBestAdd(validToAdds, toAddPreference) ??
                singleBestAdd(validToAdds, addToPreference) ??
                singleBestAdd(validToAdds, originalAddType) ??
                '';

        // If the best choice for the posted grade type hasn't been found yet,
        // Prioritize using 1) the more precise addition value type.
        if (!addTo) addTo = singleBestAdd(validAddTos, toAddPreference) ?? '';

        // If the best choice for the posted grade type still hasn't been found,
        // attempt to use 2) whatever type the addition value has settled on.
        if (!!toAdd && !addTo) {
            addTo = singleBestAdd(validAddTos, getType(toAdd)) ?? '';
        }

        // And if the best posted grade type still isn't found, fallback to,
        // 3) the target assignment type, or 4) the type of addition originally provided
        if (!addTo) {
            addTo = singleBestAdd(validAddTos, addToPreference) ?? singleBestAdd(validAddTos, originalAddType) ?? '';
        }

        if (!toAdd && !!addTo && Number.isNaN(denom)) {
            // Throw Error?
            // if (getValidType(validToAdds) === 'none') throw new Error(`Found no valid way to add to this assignment.`);
            // Or default to adding 0?
            toAdd = getType(addTo) === 'percent' ? '0%' : '0';
        }

        if (!toAdd && denom === 0 && forcePointsResult) {
            toAdd = '0';
            if (!addTo) {
                addTo = '0';
            }
        }

        // At this point both addTo and toAdd should entirely be resolved.
        // But the type checking doesn't agree with that, so here is a catch.
        if (!toAdd || !addTo)
            throw new Error(`UNRESOLVED ADDITION CHOICE! toAdd: '${toAdd}' addTo: '${addTo}' denom: ${denom}`);

        // TODO: Handle no int values but an addition would return an int
        //       - Requires precalc-ing both and possibly changing both toAdd and addTo

        return { addTo, toAdd };
    };

    // toAdd: The value to be added
    // addTo: Decides the type of the posted grade
    const { toAdd, addTo } = resolve();
    // Decides which addition function will be used
    const addTypeState = getType(toAdd);
    return [toAdd, addTo, addTypeState];
}
function generatePostedGradeMessage(
    add: string,
    target: FixedCanvasGradeScorePossible,
    postedGrade: string,
    basedOn?: number
): string {
    // decides connection phrase: 'out of' for points, 'of' for percents
    const of = (n: string | number, d: number) => `${n} ${`${n}`.includes('%') ? '' : 'out '}of ${d}`;
    // append 'total ' to 'point(s)', if using custom pointsPossible
    const points = (count: number, total = false) => `${total ? 'total ' : ''}${pluralize('points', count)}`;
    const ofPoints = (n: string | number, d: number, total = false) => `${of(n, d)} ${points(d, total)}`;
    // Displays the change provided by instructor, and grade display of assignment
    const firstLine = `Added ${basedOn ? ofPoints(add, basedOn, true) : add} to ${ofPoints(
        target.gradeType === 'percent' ? target.grade : target.score,
        target.pointsPossible
    )}\n`;
    // Displays the actual change provided to Canvas via posted_grade
    const secondLine = `Change: ${postedGrade.includes('%') ? target.score : target.grade} => ${postedGrade}`;
    return firstLine + secondLine;
}

/**
 * @param postedGrade The score or grade posted on canvas as a string.
 * @returns The parsed number in decimals, or NaN if not correctly parsable.
 */
export function parseCanvasPercentsAndPoints(postedGrade: string): number {
    const checkNonNumber = /[^\d.%]/m;
    if (postedGrade.match(checkNonNumber) || postedGrade.split('.').length > 2 || postedGrade.split('%').length > 2) {
        return Number.NaN;
    }
    const isPercent = postedGrade.endsWith('%');
    const isFloat = postedGrade.includes('.');
    const numString = isPercent ? postedGrade.slice(0, postedGrade.length - 1) : postedGrade;
    const parsed = isFloat ? Number.parseFloat(numString) : Number.parseInt(numString, 10);
    return parsed / (isPercent ? 100 : 1);
}

function convertNumberToMaxDecimalString(num: number, maxDecimals = MAX_DECIMALS): string {
    const sign = num < 0 ? -1 : 1;
    // fixes Javascript rounding, now rounds away from 0 and attempts to maintain an arbirary number of decimal places
    return `${sign * (Math.round((num * sign + Number.EPSILON) * 10 ** maxDecimals) / 10 ** maxDecimals)}`;
}

/**
 * Collects the value for the 'points_possible' property of a Canvas Assignment JSON object.
 * @param canvasAssignmentJSON Raw JSON object. (Assumed to be a Canvas Assignment)
 * @param skipCountingIf Optionally used to skip this assignment's points possible. Takes an
 * object where if any of the key-value pairs strictly equal (===) the same properties in the
 * canvasAssignmentJSON, then 0 is returned.
 *
 * If a given value is an array, the array's elements are used for the strict equality check.
 * @returns the Canvas Assignment's points possible or 0
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function collectPointsPossible(canvasAssignmentJSON: any, skipCountingIf?: { [x: string]: any }): number {
    const currentPointsPossible: number = (canvasAssignmentJSON['points_possible'] ?? 0) as number;
    const skip = (): boolean => {
        if (currentPointsPossible === 0 || skipCountingIf == null) {
            return false;
        }
        return Object.entries(skipCountingIf).some(([prop, check]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const propEquality = (compare: any) => {
                return canvasAssignmentJSON[prop] === compare;
            };
            if (Array.isArray(check)) {
                return check.some(propEquality);
            } else {
                return propEquality(check);
            }
        });
    };
    return skip() ? 0 : currentPointsPossible;
}
