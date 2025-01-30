import type {
    EarnBySurveyTokenOptionData,
    RawEarnBySurveyTokenOptionData
} from 'app/token-options/earn-by-survey/earn-by-survey-token-option';
import type {
    PlaceholderTokenOptionData,
    RawPlaceholderTokenOptionData
} from 'app/token-options/placeholder-token-option/placeholder-token-option';
import type { RawTokenOptionData, TokenOptionData } from 'app/token-options/token-option';
import { getUnixTime } from 'date-fns';
import { Base64 } from 'js-base64';
import {
    genMultipleSectionDateMatcherValues,
    MultipleSectionDateMatcherDataDef
} from '../multiple-section-date-matcher';
import type {
    ExcludeTokenOptionIdsMixinData,
    RawExcludeTokenOptionIdsMixinData
} from 'app/token-options/mixins/exclude-token-option-ids-mixin';
import type {
    OptionalMultipleSectionEndTimeMixinData,
    RawOptionalMultipleSectionEndTimeMixinData
} from 'app/token-options/mixins/optional-multiple-section-end-time-mixin';
import type {
    OptionalMultipleSectionStartTimeMixinData,
    RawOptionalMultipleSectionStartTimeMixinData
} from 'app/token-options/mixins/optional-multiple-section-start-time-mixin';
import type {
    SpendForAdditionalAssignmentTimeTokenOptionData,
    RawSpendForAdditionalAssignmentTimeTokenOptionData
} from 'app/token-options/spend-for-additional-assignment-time/spend-for-additional-assignment-time-token-option';
import type {
    ChangeAssignmentDatesMixinData,
    RawChangeAssignmentDatesMixinData
} from 'app/token-options/mixins/change-assignment-dates-mixin';
import type { DurationData } from 'app/data/date-fns-duration';

function* genRawTokenOptionDataEquivalents<T extends TokenOptionData>(
    v: T,
    genExtra = false
): Generator<T & RawTokenOptionData, void, unknown> {
    const descriptionData = {
        *[Symbol.iterator]() {
            if (v.description === '') {
                yield { ...v, description: undefined };
                yield { ...v, description: Base64.encode('') };
            } else if (typeof v.description === 'string') {
                yield { ...v, description: Base64.encode(v.description) };
            }
        }
    };

    yield* descriptionData;

    if (genExtra) {
        const invertDescription = {
            *[Symbol.iterator]() {
                for (const d of descriptionData) {
                    yield { ...d, description: d.description ? undefined : Base64.encode('test string') };
                }
            }
        };

        for (const iD of invertDescription) {
            yield { ...iD, isMigrating: iD.isMigrating === undefined ? true : undefined };
        }
    }
}

/**
 * Converts valid EarnBySurveyTokenOptionData into equivalent RawEarnBySurveyTokenOptionData.
 * And with a boolean flag, can generate additional valid but not-necessarily equal RawEarnBySurveyTokenOptionData's
 *
 * @param v an object to use as a baseline
 * @param genExtra boolean flag for generating extra non-equal but valid transformations
 */
export function* genRawEarnBySurveyDataEquivalents<T extends EarnBySurveyTokenOptionData>(
    v: T,
    genExtra = false
): Generator<
    ((T | Omit<T, 'surveyId'>) & RawEarnBySurveyTokenOptionData) | (T & Omit<RawEarnBySurveyTokenOptionData, 'quizId'>),
    void,
    unknown
> {
    const result: Omit<T, 'surveyId'> & RawEarnBySurveyTokenOptionData = {
        ...v,
        quizId: v.surveyId,
        startTime: getUnixTime(v.startTime),
        endTime: getUnixTime(v.endTime)
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (result as any)['surveyId'];
    yield* genRawTokenOptionDataEquivalents(result, genExtra);
    if (genExtra) {
        // Preserves only the 'surveyId' field
        yield* genRawTokenOptionDataEquivalents<T & Omit<RawEarnBySurveyTokenOptionData, 'quizId'>>(
            { ...v, surveyId: 'New surveyId Format', startTime: result.startTime, endTime: result.endTime },
            genExtra
        );
        // Includes both `surveyId` and `quizId` field. both are accepted in the Raw Data
        // `surveyId` should be the priority pick
        yield* genRawTokenOptionDataEquivalents<T & RawEarnBySurveyTokenOptionData>(
            {
                ...v,
                surveyId: 'Prioritized surveyId value',
                quizId: 'Prioritized quizID value',
                startTime: result.startTime,
                endTime: result.endTime
            },
            genExtra
        );
    }
}

function* genRawExcludeIdsData<T extends ExcludeTokenOptionIdsMixinData>(
    v: T,
    genExtra = false
): Generator<T & RawExcludeTokenOptionIdsMixinData, void, unknown> {
    if (v.excludeTokenOptionIds.length === 0 || genExtra) {
        const r = { ...v };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (r as any)['excludeTokenOptionIds'];
        yield { ...v, excludeTokenOptionIds: undefined };
        yield r;
    }
    if (genExtra && v.excludeTokenOptionIds.length === 0) {
        yield { ...v, excludeTokenOptionIds: [1, 2, 3] };
    }
}

export function* genRawPlaceholderDataEquivalents<T extends PlaceholderTokenOptionData>(
    v: T,
    genExtra = false
): Generator<T & RawPlaceholderTokenOptionData, void, unknown> {
    for (const rawExcludesData of genRawExcludeIdsData(v, genExtra)) {
        for (const startTimeValues of genRawOptionalMultipleSectionTimeValues(rawExcludesData.startTime, genExtra)) {
            for (const endTimeValues of genRawOptionalMultipleSectionTimeValues(rawExcludesData.endTime, genExtra)) {
                yield* genRawTokenOptionDataEquivalents(
                    { ...rawExcludesData, startTime: startTimeValues, endTime: endTimeValues },
                    genExtra
                );
            }
        }
    }
}

type OptionalSectionTimeValues =
    | OptionalMultipleSectionEndTimeMixinData['endTime']
    | OptionalMultipleSectionStartTimeMixinData['startTime'];
type RawOptionalSectionTimeValues =
    | RawOptionalMultipleSectionEndTimeMixinData['endTime']
    | RawOptionalMultipleSectionStartTimeMixinData['startTime'];

/**
 * Generate Raw values for MultipleSectionTimeOverrides Data
 * @param v valid value
 * @param genExtra flag for generating valid but not equal Raw values
 */
export function* genRawOptionalMultipleSectionTimeValues(
    v: OptionalSectionTimeValues,
    genExtra = false
): Generator<RawOptionalSectionTimeValues, void, unknown> {
    if (v === null) {
        yield null;
        yield undefined;
        if (genExtra) {
            yield getUnixTime(new Date());
            yield* genMultipleSectionDateMatcherValues(undefined, genExtra);
        }
    } else if (v instanceof Date || Object.prototype.toString.call(v) === '[object Date]') {
        yield getUnixTime(v as Date);
        if (genExtra) {
            yield null;
            yield undefined;
            yield* genMultipleSectionDateMatcherValues(undefined, genExtra);
        }
    } else if (MultipleSectionDateMatcherDataDef.is(v)) {
        yield* genMultipleSectionDateMatcherValues(v, genExtra);
        if (genExtra) {
            yield null;
            yield undefined;
            yield getUnixTime(new Date());
        }
    } else {
        throw Error(`Unimplemented Generator for Raw Multiple Section Time Values of type: (${typeof v})`);
    }
}

export function* genRawAdditionalAssignmentTimeDataEquivalents<
    T extends SpendForAdditionalAssignmentTimeTokenOptionData
>(v: T, genExtra = false): Generator<T & RawSpendForAdditionalAssignmentTimeTokenOptionData, void, unknown> {
    const dateConflictValues = {
        *[Symbol.iterator]() {
            if (v.dateConflict === undefined) {
                throw new Error(
                    '`dateConflict` must be included in a valid Additional Time token option (enforced by UI)'
                );
            }
            yield v.dateConflict;
            if (genExtra) {
                if (v.dateConflict === 'constrain') {
                    yield 'extend' as const;
                } else if (v.dateConflict === 'extend') {
                    yield 'constrain' as const;
                }
            }
        }
    };
    if (v.unlockAtChange === undefined && v.dueAtChange === undefined && v.lockAtChange === undefined) {
        throw new Error(
            // TODO: Actually enforce this in the UI
            'At least one of the `*AtChanges` should be set for the token option to be valid (Not Currently Enforced!)'
        );
    }
    for (const rawExcludesData of genRawExcludeIdsData(v, genExtra)) {
        for (const conflictValue of dateConflictValues) {
            for (const unlockAtChange of genRawChangeDateValues(v.unlockAtChange, genExtra)) {
                for (const dueAtChange of genRawChangeDateValues(v.dueAtChange, genExtra)) {
                    for (const lockAtChange of genRawChangeDateValues(v.lockAtChange, genExtra)) {
                        yield* genRawTokenOptionDataEquivalents(
                            {
                                ...rawExcludesData,
                                unlockAtChange,
                                dueAtChange,
                                lockAtChange,
                                dateConflict: conflictValue
                            },
                            genExtra
                        );
                    }
                }
            }
        }
    }
}

type ChangeDateValues = ChangeAssignmentDatesMixinData['unlockAtChange'];
type RawChangeDateValues = RawChangeAssignmentDatesMixinData['unlockAtChange'];
const durationDatePlaceholder = { years: 1, months: 1, weeks: 1, days: 1, hours: 1, minutes: 1, seconds: 1 } as const;

export function* genRawChangeDateValues(
    v: ChangeDateValues,
    genExtra = false,
    onlyStrictlyEqualDurationObects = true
): Generator<ChangeDateValues & RawChangeDateValues, void, unknown> {
    if (v != null) {
        yield* genDurationDataEquivalents(v, genExtra, onlyStrictlyEqualDurationObects);
    } else {
        yield v;
    }
    if (genExtra) {
        if (v === undefined) {
            yield null;
            yield* genDurationDataEquivalents(durationDatePlaceholder, genExtra, onlyStrictlyEqualDurationObects);
        } else if (v === null) {
            yield undefined;
            yield* genDurationDataEquivalents(durationDatePlaceholder, genExtra, onlyStrictlyEqualDurationObects);
        } else {
            yield null;
            yield undefined;
        }
    }
}

function* genDurationDataEquivalents(
    v: DurationData,
    genExtra = false,
    onlyStrictlyEqualDurationObjects = true
): Generator<DurationData, void, unknown> {
    yield v;
    if (v.years || v.months || v.weeks || v.days || v.hours || v.minutes || v.seconds) {
        if (genExtra && !onlyStrictlyEqualDurationObjects) {
            yield* distributeDown(v);
            yield* distributeUp(v);
        }
    } else {
        // !(v.years || v.months || v.weeks || v.days || v.hours || v.minutes || v.seconds)
        // i.e. No duration values besides zero therefore empty or all zero data
        // This is a interpretable raw data, but not a valid stored value.
        // The UI should prevent this case from happening
        throw new Error('No duration values were provided!');
    }
}

function* distributeDown(v: DurationData): Generator<DurationData, void, unknown> {
    if (v.years) {
        yield { ...v, years: v.years ? 0 : v.years, months: (v.months ?? 0) + (v.years ?? 0) * 12 };
        yield { ...v, years: v.years ? 0 : v.years, weeks: (v.weeks ?? 0) + (v.years ?? 0) * 52 };
    }
    if (v.weeks || v.days || v.hours || v.minutes) {
        yield {
            ...v,
            weeks: v.weeks ? 0 : v.weeks,
            days: v.days ? 0 : v.days,
            hours: v.hours ? 0 : v.hours,
            minutes: v.minutes ? 0 : v.minutes,
            seconds:
                (((v.weeks ?? 0) * 7 + (v.days ?? 0)) * 24 + (v.hours ?? 0) * 60 + (v.minutes ?? 0)) * 60 +
                (v.seconds ?? 0)
        };
    }
}
function intMod(num: number, mod: number) {
    return { remainder: num % mod, numDivisor: Math.trunc(num / mod) };
}
function* distributeUp(v: DurationData): Generator<DurationData, void, unknown> {
    const secM = v.seconds ? intMod(v.seconds, 60) : undefined;
    const minH = v.minutes ? intMod(v.minutes, 60) : undefined;
    const hoursD = v.hours ? intMod(v.hours, 24) : undefined;
    const daysW = v.days ? intMod(v.days, 7) : undefined;
    const weeksY = v.weeks ? intMod(v.weeks, 52) : undefined;
    const monthsY = v.months ? intMod(v.months, 12) : undefined;

    const result = { ...v };
    if (secM && secM.numDivisor !== 0) {
        result.seconds = secM.remainder;
        result.minutes = (result.minutes ?? 0) + secM.numDivisor;
    }
    if (minH && minH.numDivisor !== 0) {
        result.minutes = minH.remainder;
        result.hours = (result.hours ?? 0) + minH.numDivisor;
    }
    if (hoursD && hoursD.numDivisor !== 0) {
        result.hours = hoursD.remainder;
        result.days = (result.days ?? 0) + hoursD.numDivisor;
    }
    if (daysW && daysW.numDivisor !== 0) {
        result.hours = daysW.remainder;
        result.days = (result.days ?? 0) + daysW.numDivisor;
    }
    if (weeksY && weeksY.numDivisor !== 0) {
        result.hours = weeksY.remainder;
        result.days = (result.days ?? 0) + weeksY.numDivisor;
    }
    if (monthsY && monthsY.numDivisor !== 0) {
        result.hours = monthsY.remainder;
        result.days = (result.days ?? 0) + monthsY.numDivisor;
    }
    yield result;
}
