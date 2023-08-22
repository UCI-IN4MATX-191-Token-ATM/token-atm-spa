import { isLeft } from 'fp-ts/lib/Either';
import { Base64 } from 'js-base64';
import {
    EarnBySurveyTokenOptionDataDef,
    type EarnBySurveyTokenOptionData,
    type RawEarnBySurveyTokenOptionData,
    EarnBySurveyTokenOption
} from './earn-by-survey-token-option';
import { fromUnixTime, getUnixTime } from 'date-fns';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { TO_BE_SUPER_SET_OF_MATCHER } from 'app/utils/test/to-be-super-set-of-matcher';

describe('EarnBySurveyTokenOption', () => {
    const testDate = fromUnixTime(getUnixTime(new Date()));

    const validValues: EarnBySurveyTokenOptionData[] = [
        {
            type: 'earn-by-survey',
            id: 1,
            name: 'A',
            description: '',
            tokenBalanceChange: 1,
            isMigrating: undefined,
            surveyId: '',
            fieldName: '',
            startTime: testDate,
            endTime: testDate
        }
    ];
    const validRawValuesPair: [EarnBySurveyTokenOptionData, RawEarnBySurveyTokenOptionData][] = validValues.map((v) => {
        const result: RawEarnBySurveyTokenOptionData = {
            ...v,
            description: v.description ? Base64.encode(v.description) : undefined,
            quizId: v.surveyId,
            startTime: getUnixTime(v.startTime),
            endTime: getUnixTime(v.endTime)
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (result as any)['surveyId'];
        return [v, result];
    });
    const invalidValues = [
        {},
        {
            type: undefined,
            id: '1',
            name: 1,
            description: 1,
            tokenBalanceChange: '1',
            isMigrating: 'true',
            surveyId: 1,
            fieldName: 1,
            startTime: 1,
            endTime: 1
        },
        {
            type: undefined,
            id: 1,
            name: 'A',
            description: '',
            tokenBalanceChange: 1,
            isMigrating: undefined,
            surveyId: '',
            fieldName: '',
            startTime: new Date(),
            endTime: new Date()
        }
    ];
    const invalidRawValues = [
        {},
        {
            type: undefined,
            id: '1',
            name: 1,
            description: 1,
            tokenBalanceChange: '1',
            isMigrating: 'true',
            surveyId: 1,
            fieldName: 1,
            startTime: undefined,
            endTime: undefined
        },
        {
            type: undefined,
            id: 1,
            name: 'A',
            description: '',
            tokenBalanceChange: 1,
            isMigrating: undefined,
            surveyId: '',
            fieldName: '',
            startTime: getUnixTime(new Date()),
            endTime: getUnixTime(new Date())
        }
    ];

    describe('EarnBySurveyTokenOptionDataDef', () => {
        validRawValuesPair.forEach(([expected, value]) => {
            it(`should decode sucessfully with valid raw value ${JSON.stringify(value)}`, () => {
                const result = EarnBySurveyTokenOptionDataDef.decode(value);
                expect(isLeft(result)).toBeFalse();
                if (!isLeft(result)) expect(result.right).toEqual(expected);
            });
        });

        invalidRawValues.forEach((value) => {
            it(`should fail to decode with invalid raw value ${JSON.stringify(value)}`, () => {
                const result = EarnBySurveyTokenOptionDataDef.decode(value);
                expect(isLeft(result)).toBeTrue();
            });
        });

        validValues.forEach((value) => {
            it(`should validate successfully with valid value ${JSON.stringify(value)}`, () => {
                expect(EarnBySurveyTokenOptionDataDef.is(value)).toBeTrue();
            });
        });

        invalidValues.forEach((value) => {
            it(`should fail to validate with invalid value ${JSON.stringify(value)}`, () => {
                expect(EarnBySurveyTokenOptionDataDef.is(value)).toBeFalse();
            });
        });

        validRawValuesPair.forEach(([value, expected]) => {
            it(`should encode successfully with valid value ${JSON.stringify(value)}`, () => {
                const result = EarnBySurveyTokenOptionDataDef.encode(value);
                expect(result).toEqual({
                    ...expected,
                    description: expected.description ?? ''
                });
            });
        });
    });

    describe('EarnBySurveyTokenOption', () => {
        let value: EarnBySurveyTokenOption;

        beforeEach(() => {
            value = new EarnBySurveyTokenOption();
            jasmine.addMatchers(TO_BE_SUPER_SET_OF_MATCHER);
        });

        it('should have property `type`', () => {
            expect(value.type).toEqual('');
            value.type = 'A';
            expect(value.type).toEqual('A');
        });

        it('should have property `id`', () => {
            expect(value.id).toEqual(-1);
            value.id = 1;
            expect(value.id).toEqual(1);
        });

        it('should have property `name`', () => {
            expect(value.name).toEqual('');
            value.name = 'Name';
            expect(value.name).toEqual('Name');
        });

        it('should have property `description`', () => {
            expect(value.description).toEqual('');
            value.description = 'Description';
            expect(value.description).toEqual('Description');
        });

        it('should have property `tokenBalanceChange`', () => {
            expect(value.tokenBalanceChange).toEqual(0);
            value.tokenBalanceChange = 1;
            expect(value.tokenBalanceChange).toEqual(1);
        });

        it('should have property `isMigrating`', () => {
            expect(value.isMigrating).toBeUndefined();
            value.isMigrating = true;
            expect(value.isMigrating).toBeTrue();
        });

        it('should have property `group`', () => {
            const mockedGroup: TokenOptionGroup = jasmine.createSpyObj(
                'TokenOptionGroup',
                [],
                ['configuration']
            ) as unknown as TokenOptionGroup;
            value.group = mockedGroup;
            expect(value.group).toEqual(mockedGroup);
        });

        it('should throw error when accessing `group` before `group` is set', () => {
            expect(() => value.group).toThrowError('Token option group is not set yet!');
        });

        it('should have property `surveyId`', () => {
            expect(value.surveyId).toEqual('');
            value.surveyId = 'Survey ID';
            expect(value.surveyId).toEqual('Survey ID');
        });

        it('should have property `fieldName`', () => {
            expect(value.fieldName).toEqual('');
            value.fieldName = 'Field Name';
            expect(value.fieldName).toEqual('Field Name');
        });

        it('should have property `startTime`', () => {
            expect(value.startTime).toBeInstanceOf(Date);
            const date = new Date();
            value.startTime = date;
            expect(value.startTime).toEqual(date);
        });

        it('should have property `endTime`', () => {
            expect(value.endTime).toBeInstanceOf(Date);
            const date = new Date();
            value.endTime = date;
            expect(value.endTime).toEqual(date);
        });

        validRawValuesPair.forEach(([data, rawData]) => {
            it(`should decode successfully with raw data ${JSON.stringify(rawData)}`, () => {
                expect(value.fromRawData(rawData)).toBeSupersetOf(data);
            });
        });

        invalidRawValues.forEach((rawData) => {
            it(`should fail to decode with invalid raw data ${JSON.stringify(rawData)}`, () => {
                expect(() => value.fromRawData(rawData)).toThrowError();
            });
        });

        validValues.forEach((data) => {
            it(`should construct successfully with data ${JSON.stringify(data)}`, () => {
                expect(value.fromData(data)).toBeSupersetOf(data);
            });
        });

        invalidValues.forEach((data) => {
            it(`should fail to construct with invalid data ${JSON.stringify(data)}`, () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(() => value.fromData(data as any)).toThrowError();
            });
        });

        validRawValuesPair.forEach(([data, rawData]) => {
            it(`should encode successfully to raw data with data ${JSON.stringify(data)}`, () => {
                const result = value.fromData(data).toJSON();
                expect(result).toEqual({
                    ...rawData,
                    description: rawData.description ?? ''
                });
            });
        });
    });
});
