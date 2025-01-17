/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
    EarnBySurveyTokenOptionData,
    RawEarnBySurveyTokenOptionData
} from 'app/token-options/earn-by-survey/earn-by-survey-token-option';
// import type { PlaceholderTokenOptionData } from 'app/token-options/placeholder-token-option/placeholder-token-option';
import type { TokenOptionData } from 'app/token-options/token-option';
import { getUnixTime } from 'date-fns';
import { Base64 } from 'js-base64';

function* genRawTokenOptionDataEquivs<T extends TokenOptionData>(v: T, genExtra = false): Generator<T, void, any> {
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
): Generator<T, void, any> {
    const result: RawEarnBySurveyTokenOptionData = {
        ...v,
        quizId: v.surveyId,
        startTime: getUnixTime(v.startTime),
        endTime: getUnixTime(v.endTime)
    };
    delete (result as any)['surveyId'];
    yield* genRawTokenOptionDataEquivs<T>(result as any, genExtra);
    if (genExtra) {
        // Preserves the 'surveyId' field
        yield* genRawTokenOptionDataEquivs<T>(
            { ...v, surveyId: 'New surveyId Format', startTime: result.startTime, endTime: result.endTime },
            genExtra
        );
        // Includes both `surveyId` and `quizId` field. both are accepted in the Raw Data
        // `surveyId` should be the priority pick
        yield* genRawTokenOptionDataEquivs<T>(
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

// export function* genRawPlaceholderDataEquivs<T extends PlaceholderTokenOptionData>(
//     v: T,
//     genExtra = false
// ): Generator<T, void, any> {}
