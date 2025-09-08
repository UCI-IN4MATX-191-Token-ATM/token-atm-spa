import { isLeft, isRight } from 'fp-ts/lib/Either';
import { Base64 } from 'js-base64';
import {
    SpendForPassingAssignmentTokenOptionDataDef,
    type SpendForPassingAssignmentTokenOptionData,
    type RawSpendForPassingAssignmentTokenOptionData,
    SpendForPassingAssignmentTokenOption
} from './spend-for-passing-assignment-token-option';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { TO_BE_SUPER_SET_OF_MATCHER } from 'app/utils/test/to-be-super-set-of-matcher';
import { genRawSpendForPassingAssignmentDataEquivalents } from 'app/utils/test/generate-raw-equivalents';

describe('SpendForPassingAssignmentTokenOption', () => {
    const validValues: SpendForPassingAssignmentTokenOptionData[] = [
        {
            type: 'spend-for-passing-assignment',
            id: 1,
            name: 'A',
            description: '',
            tokenBalanceChange: 1,
            isMigrating: undefined,
            assignmentName: '',
            assignmentId: '',
            gradeThreshold: 1,
            excludeTokenOptionIds: []
        }
    ];
    const validRawValuesPair: [
        SpendForPassingAssignmentTokenOptionData,
        RawSpendForPassingAssignmentTokenOptionData
    ][] = validValues.map((v) => {
        const result: RawSpendForPassingAssignmentTokenOptionData = {
            ...v,
            description: v.description ? Base64.encode(v.description) : undefined,
            excludeTokenOptionIds: v.excludeTokenOptionIds.length === 0 ? undefined : v.excludeTokenOptionIds
        };
        // Placeholder for backwards compatiblity check
        // if (v.replaceGrade.includes('%')) {
        //     result.gradeThreshold = parseFloat(v.replaceGrade) / 100;
        //     delete result['replaceGrade'];
        // }
        return [v, result];
    });

    it('genRawDataEquivalents contains the previous validRawValue(s)', () => {
        for (const [valid, raw] of validRawValuesPair) {
            const b = Array.from(genRawSpendForPassingAssignmentDataEquivalents(valid));
            let i = 0;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const _ of genRawSpendForPassingAssignmentDataEquivalents(valid)) {
                i++;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(b).toContain(raw as any);
            expect(b.length).toBeLessThanOrEqual(i);
        }
    });

    const invalidValues = [
        {},
        {
            type: 'undefined',
            id: '1',
            name: 1,
            description: 1,
            tokenBalanceChange: '1',
            isMigrating: 'true',
            assignmentName: 1,
            assignmentId: 1,
            gradeThreshold: '100%',
            excludeTokenOptionIds: 5
        },
        {
            type: 'spend-for-passing-assignment',
            id: 1,
            name: 'A',
            description: '',
            tokenBalanceChange: 1,
            isMigrating: undefined,
            assignmentName: '',
            assignmentId: '',
            gradeThreshold: '100%',
            excludeTokenOptionIds: []
        },
        {
            type: undefined,
            id: 1,
            name: 'A',
            description: '',
            tokenBalanceChange: 1,
            isMigrating: undefined,
            assignmentName: '',
            assignmentId: '',
            gradeThreshold: 1,
            excludeTokenOptionIds: []
        }
    ];
    const invalidRawValues = [{}];

    describe('SpendForPassingAssignmentTokenOptionDataDef', () => {
        for (const expected of validValues) {
            for (const value of genRawSpendForPassingAssignmentDataEquivalents(expected)) {
                it(`should decode successfully with valid raw value ${JSON.stringify(value)}`, () => {
                    const result = SpendForPassingAssignmentTokenOptionDataDef.decode(value);
                    expect(isLeft(result)).toBeFalse();
                    if (!isLeft(result)) expect(result.right).toEqual(expected);
                });
            }
        }

        for (const expected of validValues) {
            for (const value of genRawSpendForPassingAssignmentDataEquivalents(expected, true)) {
                it(`should decode successfully all extra raw data values based on ${JSON.stringify(value)}`, () => {
                    const result = SpendForPassingAssignmentTokenOptionDataDef.decode(value);
                    expect(isLeft(result)).toBeFalse();
                    expect(isRight(result)).toBeTrue();
                });
            }
        }

        invalidRawValues.forEach((value) => {
            it(`should fail to decode with invalid raw value ${JSON.stringify(value)}`, () => {
                const result = SpendForPassingAssignmentTokenOptionDataDef.decode(value);
                expect(isLeft(result)).toBeTrue();
            });
        });

        validValues.forEach((value) => {
            it(`should validate successfully with valid value ${JSON.stringify(value)}`, () => {
                expect(SpendForPassingAssignmentTokenOptionDataDef.is(value)).toBeTrue();
            });
        });

        invalidValues.forEach((value) => {
            it(`should fail to validate with invalid value ${JSON.stringify(value)}`, () => {
                expect(SpendForPassingAssignmentTokenOptionDataDef.is(value)).toBeFalse();
            });
        });

        for (const value of validValues) {
            it(`should encode successfully with valid value ${JSON.stringify(value)}`, () => {
                const result = SpendForPassingAssignmentTokenOptionDataDef.encode(value);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(Array.from(genRawSpendForPassingAssignmentDataEquivalents(value))).toContain(result as any);
            });
        }
    });

    describe('SpendForPassingAssignmentTokenOption', () => {
        let value: SpendForPassingAssignmentTokenOption;

        beforeEach(() => {
            value = new SpendForPassingAssignmentTokenOption();
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

        it('should have property `assignmentName`', () => {
            expect(value.assignmentName).toEqual('');
            value.assignmentName = 'Assignment Name';
            expect(value.assignmentName).toEqual('Assignment Name');
        });

        it('should have property `assignmentId`', () => {
            expect(value.assignmentName).toEqual('');
            value.assignmentId = 'Assignment ID';
            expect(value.assignmentId).toEqual('Assignment ID');
        });

        // TODO: Update after making backwards compatible change
        it('should have property `gradeThreshold`', () => {
            expect(value.gradeThreshold).toEqual(1);
            value.gradeThreshold = 0.5;
            expect(value.gradeThreshold).toEqual(0.5);
        });

        it('should have property `startTime`', () => {
            expect(value.excludeTokenOptionIds).toBeInstanceOf(Array);
            const numArray = [1, 2, 3];
            value.excludeTokenOptionIds = numArray as never[]; // TODO: figure out why jasmine assumes this type
            expect(value.excludeTokenOptionIds).toEqual(numArray as never[]);
        });

        for (const data of validValues) {
            for (const rawData of genRawSpendForPassingAssignmentDataEquivalents(data)) {
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
                expect(Array.from(genRawSpendForPassingAssignmentDataEquivalents(data))).toContain(result as any);
            });
        }
    });
});
