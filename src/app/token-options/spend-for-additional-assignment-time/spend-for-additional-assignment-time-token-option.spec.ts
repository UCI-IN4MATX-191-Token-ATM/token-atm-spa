import { isLeft, isRight } from 'fp-ts/lib/Either';
import {
    SpendForAdditionalAssignmentTimeTokenOption,
    type SpendForAdditionalAssignmentTimeTokenOptionData,
    SpendForAdditionalAssignmentTimeTokenOptionDataDef
} from './spend-for-additional-assignment-time-token-option';
import { genRawAdditionalAssignmentTimeDataEquivalents } from 'app/utils/test/generate-raw-equivalents';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { TO_BE_SUPER_SET_OF_MATCHER } from 'app/utils/test/to-be-super-set-of-matcher';

describe('SpendForAdditionalAssignmentTimeTokenOption', () => {
    const validTemplate: SpendForAdditionalAssignmentTimeTokenOptionData = {
        type: 'spend-for-additional-assignment-time',
        id: 0,
        name: '',
        description: '',
        tokenBalanceChange: 0,
        isMigrating: false,
        assignmentName: '',
        assignmentId: '',
        unlockAtChange: null,
        dueAtChange: null,
        lockAtChange: null,
        dateConflict: 'constrain',
        allowedRequestCnt: 1,
        excludeTokenOptionIds: []
    };

    const validValues: SpendForAdditionalAssignmentTimeTokenOptionData[] = [
        validTemplate,
        { ...validTemplate, unlockAtChange: { weeks: 1 }, dueAtChange: undefined, lockAtChange: undefined },
        { ...validTemplate, unlockAtChange: undefined, dueAtChange: { days: 1 }, lockAtChange: { hours: 36 } },
        { ...validTemplate, dateConflict: 'extend' }
    ];

    const invalidValues: unknown[] = [
        {}
        // Below are currently valid, but should be prevented by the UI
        // Not prevented by UI but the non-change is accounted for during handling (request is rejected)
        // { ...validTemplate, unlockAtChange: undefined, dueAtChange: undefined, lockAtChange: undefined },
        // Prevented by the UI
        // { ...validTemplate, dateConflict: undefined }
    ];
    const invalidRawValues: unknown[] = [{}];

    describe('SpendForAdditionalAssignmentTimeTokenOptionDataDef', () => {
        for (const expected of validValues) {
            for (const value of genRawAdditionalAssignmentTimeDataEquivalents(expected)) {
                it(`should decode successfully with valid raw value ${JSON.stringify(value)}`, () => {
                    const result = SpendForAdditionalAssignmentTimeTokenOptionDataDef.decode(value);
                    expect(isLeft(result)).toBeFalse();
                    if (!isLeft(result)) expect(result.right).toEqual(expected);
                });
            }
        }

        for (const expected of validValues) {
            for (const value of genRawAdditionalAssignmentTimeDataEquivalents(expected, true)) {
                describe(`Test generated raw data (${JSON.stringify(value)})`, () => {
                    const result = SpendForAdditionalAssignmentTimeTokenOptionDataDef.decode(value);
                    it(`should decode successfully`, () => {
                        expect(isLeft(result)).toBeFalse();
                        expect(isRight(result)).toBeTrue();
                    });
                });
            }
        }

        for (const value of invalidRawValues) {
            it(`should fail to decode with invalid raw value ${JSON.stringify(value)}`, () => {
                const result = SpendForAdditionalAssignmentTimeTokenOptionDataDef.decode(value);
                expect(isLeft(result)).toBeTrue();
            });
        }

        for (const value of validValues) {
            it(`should validate successfully with valid value ${JSON.stringify(value)}`, () => {
                expect(SpendForAdditionalAssignmentTimeTokenOptionDataDef.is(value)).toBeTrue();
            });
        }

        for (const value of invalidValues) {
            it(`should fail to validate with invalid value ${JSON.stringify(value)}`, () => {
                expect(SpendForAdditionalAssignmentTimeTokenOptionDataDef.is(value)).toBeFalse();
            });
        }

        for (const value of validValues) {
            it(`should encode successfully with valid value ${JSON.stringify(value)}`, () => {
                const equalRawValues = Array.from(genRawAdditionalAssignmentTimeDataEquivalents(value));
                const result = SpendForAdditionalAssignmentTimeTokenOptionDataDef.encode(value);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(equalRawValues).toContain(result as any);
            });
        }
    });

    describe('SpendForAdditionalAssignmentTimeTokenOption', () => {
        let value: SpendForAdditionalAssignmentTimeTokenOption;

        beforeEach(() => {
            value = new SpendForAdditionalAssignmentTimeTokenOption();
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
            const name = 'An Assignment';
            value.assignmentName = name;
            expect(value.assignmentName).toEqual(name);
        });

        it('should have property `assignmentId`', () => {
            expect(value.assignmentId).toEqual('');
            const id = '100';
            value.assignmentId = id;
            expect(value.assignmentId).toEqual(id);
        });

        it('should have property `unlockAtChange`', () => {
            expect(value.unlockAtChange).toBeUndefined();
            const remove = null;
            value.unlockAtChange = remove;
            expect(value.unlockAtChange).toBeNull();
        });

        it('should have property `dueAtChange`', () => {
            expect(value.dueAtChange).toBeUndefined();
            const remove = null;
            value.dueAtChange = remove;
            expect(value.dueAtChange).toBeNull();
        });

        it('should have property `lockAtChange`', () => {
            expect(value.lockAtChange).toBeUndefined();
            const remove = null;
            value.lockAtChange = remove;
            expect(value.lockAtChange).toBeNull();
        });

        it('should have property `dateConflict`', () => {
            expect(value.dateConflict).toBeUndefined();
            value.dateConflict = 'constrain';
            expect(value.dateConflict).toBe('constrain');
            value.dateConflict = 'extend';
            expect(value.dateConflict).toBe('extend');
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
            for (const rawData of genRawAdditionalAssignmentTimeDataEquivalents(data)) {
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
                expect(Array.from(genRawAdditionalAssignmentTimeDataEquivalents(data))).toContain(result as any);
            });
        }
    });
});
