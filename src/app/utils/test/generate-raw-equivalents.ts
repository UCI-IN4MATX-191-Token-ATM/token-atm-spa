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
import { genRawMultipleSectionTimeValues } from '../multiple-section-date-matcher';
import type { RawExcludeTokenOptionIdsMixinData } from 'app/token-options/mixins/exclude-token-option-ids-mixin';

function* genRawTokenOptionDataEquivs<T extends TokenOptionData>(
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
export function* genRawEarnBySurveyDataEquivs<T extends EarnBySurveyTokenOptionData>(
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
    yield* genRawTokenOptionDataEquivs(result, genExtra);
    if (genExtra) {
        // Preserves only the 'surveyId' field
        yield* genRawTokenOptionDataEquivs<T & Omit<RawEarnBySurveyTokenOptionData, 'quizId'>>(
            { ...v, surveyId: 'New surveyId Format', startTime: result.startTime, endTime: result.endTime },
            genExtra
        );
        // Includes both `surveyId` and `quizId` field. both are accepted in the Raw Data
        // `surveyId` should be the priority pick
        yield* genRawTokenOptionDataEquivs<T & RawEarnBySurveyTokenOptionData>(
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

export function* genRawPlaceholderDataEquivs<T extends PlaceholderTokenOptionData>(
    v: T,
    genExtra = false
): Generator<T & RawPlaceholderTokenOptionData, void, unknown> {
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
        for (const startTimeValues of genRawMultipleSectionTimeValues(rawExcludesData.startTime, genExtra)) {
            for (const endTimeValues of genRawMultipleSectionTimeValues(rawExcludesData.endTime, genExtra)) {
                yield* genRawTokenOptionDataEquivs(
                    { ...rawExcludesData, startTime: startTimeValues, endTime: endTimeValues },
                    genExtra
                );
            }
        }
    }
}
