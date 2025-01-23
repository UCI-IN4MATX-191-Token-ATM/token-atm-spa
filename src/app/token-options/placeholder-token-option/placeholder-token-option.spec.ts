import { isLeft, isRight } from 'fp-ts/lib/Either';
import {
    PlaceholderTokenOption,
    type PlaceholderTokenOptionData,
    PlaceholderTokenOptionDataDef
} from './placeholder-token-option';
import { fromUnixTime, getUnixTime } from 'date-fns';
import { genRawPlaceholderDataEquivs } from 'app/utils/test/generate-raw-equivalents';
import { MultipleSectionDateMatcher } from 'app/utils/multiple-section-date-matcher';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { TO_BE_SUPER_SET_OF_MATCHER } from 'app/utils/test/to-be-super-set-of-matcher';

describe('PlaceholderTokenOption', () => {
    const testDate = fromUnixTime(getUnixTime(new Date()));

    const validTemplate: PlaceholderTokenOptionData = {
        type: 'placeholder-token-option',
        id: 1,
        name: 'A',
        description: '',
        tokenBalanceChange: 0,
        isMigrating: undefined,
        startTime: null,
        endTime: null,
        allowedRequestCnt: 1,
        excludeTokenOptionIds: []
    };
    const validValues: PlaceholderTokenOptionData[] = [
        validTemplate,
        {
            ...validTemplate,
            startTime: testDate,
            endTime: testDate
        },
        {
            ...validTemplate,
            startTime: new MultipleSectionDateMatcher(testDate),
            endTime: new MultipleSectionDateMatcher(testDate)
        }
    ];

    const invalidValues: unknown[] = [
        {},
        { ...validTemplate, startTime: undefined },
        { ...validTemplate, endTime: undefined },
        { ...validTemplate, excludeTokenOptionIds: undefined }
    ];
    const invalidRawValues: unknown[] = [{}];

    describe('PlaceholderTokenOptionDataDef', () => {
        for (const expected of validValues) {
            for (const value of genRawPlaceholderDataEquivs(expected)) {
                it(`should decode successfully with valid raw value ${JSON.stringify(value)}`, () => {
                    const result = PlaceholderTokenOptionDataDef.decode(value);
                    if (isLeft(result)) {
                        console.log('E:', expected);
                        console.log('V:', value);
                    }
                    expect(isLeft(result)).toBeFalse();
                    if (!isLeft(result)) expect(result.right).toEqual(expected);
                });
            }
        }

        for (const expected of validValues) {
            for (const value of genRawPlaceholderDataEquivs(expected, true)) {
                it(`should decode successfully all extra raw data based on ${JSON.stringify(value)}`, () => {
                    const result = PlaceholderTokenOptionDataDef.decode(value);
                    expect(isLeft(result)).toBeFalse();
                    expect(isRight(result)).toBeTrue();
                });
            }
        }

        for (const value of invalidRawValues) {
            it(`should fail to decode with invalid raw value ${JSON.stringify(value)}`, () => {
                const result = PlaceholderTokenOptionDataDef.decode(value);
                expect(isLeft(result)).toBeTrue();
            });
        }

        for (const value of validValues) {
            it(`should validate successfully with valid value ${JSON.stringify(value)}`, () => {
                expect(PlaceholderTokenOptionDataDef.is(value)).toBeTrue();
            });
        }

        for (const value of invalidValues) {
            it(`should fail to validate with invalid value ${JSON.stringify(value)}`, () => {
                expect(PlaceholderTokenOptionDataDef.is(value)).toBeFalse();
            });
        }

        for (const value of validValues) {
            it(`should encode successfully with valid value ${JSON.stringify(value)}`, () => {
                const equalRawValues = Array.from(genRawPlaceholderDataEquivs(value));
                const result = PlaceholderTokenOptionDataDef.encode(value);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(equalRawValues).toContain(result as any);
            });
        }
    });

    describe('PlaceholderTokenOption', () => {
        let value: PlaceholderTokenOption;

        beforeEach(() => {
            value = new PlaceholderTokenOption();
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

        it('should have property `startTime`', () => {
            expect(value.startTime).toBe(null);
            const date = new Date();
            value.startTime = date;
            expect(value.startTime).toEqual(date);
            const matcher = new MultipleSectionDateMatcher(date);
            value.startTime = matcher;
            expect(value.startTime).toEqual(matcher);
        });

        it('should have property `endTime`', () => {
            expect(value.endTime).toBe(null);
            const date = new Date();
            value.endTime = date;
            expect(value.endTime).toEqual(date);
            const matcher = new MultipleSectionDateMatcher(date);
            value.endTime = matcher;
            expect(value.endTime).toEqual(matcher);
        });

        it('should have property `allowedRequestCnt`', () => {
            expect(value.allowedRequestCnt).toEqual(1);
            value.allowedRequestCnt = 2;
            expect(value.allowedRequestCnt).toEqual(2);
        });

        // TODO: Figure out why Jasmine Array matcher assumes `excludeTokenOptionIds` is type `never[]`
        it('should have property `excludeTokenOptionIds`', () => {
            expect(value.excludeTokenOptionIds as number[]).toEqual([]);
            (value.excludeTokenOptionIds as number[]) = [1, 2, 4];
            expect(value.excludeTokenOptionIds as number[]).toEqual([1, 2, 4]);
        });

        for (const data of validValues) {
            for (const rawData of genRawPlaceholderDataEquivs(data)) {
                it(`should decode successfully with raw data ${JSON.stringify(rawData)}`, () => {
                    expect(value.fromRawData(rawData)).toBeSupersetOf(data);
                });
            }
        }

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

        for (const data of validValues) {
            it(`should encode successfully to raw data with data ${JSON.stringify(data)}`, () => {
                const result = value.fromData(data).toJSON();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(Array.from(genRawPlaceholderDataEquivs(data))).toContain(result as any);
            });
        }
    });
});
