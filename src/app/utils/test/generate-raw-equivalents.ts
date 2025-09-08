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
import type { RawExcludeTokenOptionIdsMixinData } from 'app/token-options/mixins/exclude-token-option-ids-mixin';
import type {
    OptionalMultipleSectionEndTimeMixinData,
    RawOptionalMultipleSectionEndTimeMixinData
} from 'app/token-options/mixins/optional-multiple-section-end-time-mixin';
import type {
    OptionalMultipleSectionStartTimeMixinData,
    RawOptionalMultipleSectionStartTimeMixinData
} from 'app/token-options/mixins/optional-multiple-section-start-time-mixin';
import type { SpendForPassingAssignmentTokenOptionData } from 'app/token-options/spend-for-passing-assignment/spend-for-passing-assignment-token-option';

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

export function* genRawPlaceholderDataEquivalents<T extends PlaceholderTokenOptionData>(
    v: T,
    genExtra = false
): Generator<T & RawPlaceholderTokenOptionData, void, unknown> {
    /**
     * @todo extract into generator function (also in {@link genRawSpendForPassingAssignmentDataEquivalents})
     */
    const excludeIdsData = {
        *[Symbol.iterator](): Generator<T & RawExcludeTokenOptionIdsMixinData, void, unknown> {
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
    };
    for (const rawExcludesData of excludeIdsData) {
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

export function* genRawSpendForPassingAssignmentDataEquivalents<T extends SpendForPassingAssignmentTokenOptionData>(
    v: T,
    genExtra = false
): Generator<T & SpendForPassingAssignmentTokenOptionData, void, unknown> {
    /**
     * @todo extract into generator function (also in {@link genRawPlaceholderDataEquivalents})
     */
    const excludeIdsData = {
        *[Symbol.iterator](): Generator<T & RawExcludeTokenOptionIdsMixinData, void, unknown> {
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
    };

    for (const excludeIds of excludeIdsData) {
        yield* genRawTokenOptionDataEquivalents(excludeIds, genExtra);
    }
}
