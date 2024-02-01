// type CanvasGradingTypes = 'pass_fail' | 'percent' | 'points';
// type UnsupportedGradingTypes = 'letter_grade' | 'gpa_scale';

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

function convertNumberToMaxDecimalString(num: number, maxDecimals = 2): string {
    const sign = num < 0 ? -1 : 1;
    // fixes Javascript rounding, now rounds away from 0 and attempts to maintain an arbirary number of decimal places
    return `${sign * (Math.round((num * sign + Number.EPSILON) * 10 ** maxDecimals) / 10 ** maxDecimals)}`;
}
