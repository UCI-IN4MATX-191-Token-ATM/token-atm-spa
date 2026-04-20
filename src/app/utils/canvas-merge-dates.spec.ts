import { add } from 'date-fns';
import {
    areOverrideDatesEqual,
    mergeOverrideDates,
    mostSpecificDateSource,
    defaultCanvasDateLevels,
    type OverrideDates,
    type CheckAndCollect,
    boundsCheck,
    changeOverrideDates,
    replaceOverrideDates,
    checkAndFixBoundaries
} from './canvas-merge-dates';
import type { DurationData } from 'app/data/date-fns-duration';

const equalDate = new Date();
/** Override Dates that are all the same day */
const allEqual: OverrideDates = { unlockAt: equalDate, dueAt: equalDate, lockAt: equalDate };
/** Override Dates that are all different, and are the least restrictive for each kind */
const allDiff: OverrideDates = {
    unlockAt: add(equalDate, { days: -1 }),
    dueAt: add(equalDate, { days: 1 }),
    lockAt: add(equalDate, { days: 2 })
};
/** Override Dates that are all set to Null */
const allNull: OverrideDates = { unlockAt: null, dueAt: null, lockAt: null };

describe('Canvas Merge Dates Tests', () => {
    describe('Equality Tests', () => {
        function equal(a: OverrideDates, b?: OverrideDates) {
            return areOverrideDatesEqual(a, b ?? structuredClone(a));
        }
        it('All Equal Dates are found Equal', () => {
            expect(equal(allEqual)).toBeTrue();
            expect(equal(allDiff)).toBeTrue();
        });
        it('All Nulls are found Equal', () => {
            expect(equal(allNull)).toBeTrue();
        });
        it('Differing Dates are found Unequal', () => {
            expect(equal(allEqual, allDiff)).toBeFalse();
            // TODO: Use combination generator to test all possibilities
            expect(equal(allEqual, { ...allDiff, unlockAt: equalDate })).toBeFalse();
            expect(equal(allEqual, { ...allDiff, dueAt: equalDate })).toBeFalse();
            expect(equal(allEqual, { ...allDiff, lockAt: equalDate })).toBeFalse();
            expect(equal(allEqual, { ...allDiff, unlockAt: equalDate, dueAt: equalDate })).toBeFalse();
            expect(equal(allEqual, { ...allDiff, dueAt: equalDate, lockAt: equalDate })).toBeFalse();
            expect(equal(allEqual, { ...allDiff, lockAt: equalDate, unlockAt: equalDate })).toBeFalse();
        });
        it('Dates & Nulls are not Equal', () => {
            expect(equal(allEqual, allNull)).toBeFalse();
            // TODO: Test all combinations programmatically
        });
        it('More Dates & Nulls are not Equal', () => {
            expect(equal(allDiff, allNull)).toBeFalse();
            // TODO: Test all combinations programmatically
        });
    });

    describe('Merge Tests', () => {
        type Params = {
            expect: OverrideDates;
            arg: [OverrideDates, OverrideDates];
            skip?: (keyof NonNullable<Parameters<typeof mergeOverrideDates>[3]>)[];
        };
        function testOrdering(arg: Params): Params[] {
            const args = [arg, structuredClone(arg)];
            args[1]?.arg.reverse();
            return args;
        }
        const defaultMergeTests: Params[] = [
            { expect: allDiff, arg: [allEqual, allDiff] },
            { expect: allNull, arg: [allDiff, allNull] },
            { expect: allNull, arg: [allEqual, allNull] }
        ];
        function runTest(
            p: Params,
            preserveDates?: Parameters<typeof mergeOverrideDates>[2],
            skipMerging?: Parameters<typeof mergeOverrideDates>[3]
        ) {
            return expect(
                areOverrideDatesEqual(p.expect, mergeOverrideDates(...p.arg, preserveDates, skipMerging))
            ).toBeTrue();
        }
        it('Default Merge', () => {
            defaultMergeTests.flatMap(testOrdering).forEach((p) => runTest(p));
        });
        function adjustForSkip({ expect, arg, skip }: Params): Params {
            const newExpect = () => {
                if (skip == null) return expect;
                const e = { ...expect };
                skip.forEach((el) => {
                    e[el] = arg[0][el];
                });
                return e;
            };
            return { expect: newExpect(), arg, skip };
        }
        function testWithSkip(ps: Params[], preserveDates = false) {
            ps.map(adjustForSkip).forEach((p) =>
                runTest(p, preserveDates, p.skip ? Object.fromEntries(p.skip.map((x) => [x, true])) : {})
            );
        }
        it('With Optional Skip Merging', () => {
            const tests = defaultMergeTests.flatMap(testOrdering);
            testWithSkip(
                tests.map((p): Params => {
                    return { ...p, skip: ['unlockAt'] };
                })
            );
            testWithSkip(
                tests.map((p): Params => {
                    return { ...p, skip: ['dueAt'] };
                })
            );
            testWithSkip(
                tests.map((p): Params => {
                    return { ...p, skip: ['lockAt'] };
                })
            );
        });
        const preserveDateTests: Params[] = [
            { expect: allDiff, arg: [allEqual, allDiff] },
            { expect: allDiff, arg: [allDiff, allNull] },
            { expect: allEqual, arg: [allEqual, allNull] }
        ];
        describe('With Preserve Dates Flag', () => {
            it('Default', () => {
                preserveDateTests.flatMap(testOrdering).forEach((p) => runTest(p, true));
            });
            it('& With Optional Skip Merging', () => {
                const tests = preserveDateTests.flatMap(testOrdering);

                testWithSkip(
                    tests.map((p): Params => {
                        return { ...p, skip: ['unlockAt'] };
                    }),
                    true
                );
                testWithSkip(
                    tests.map((p): Params => {
                        return { ...p, skip: ['dueAt'] };
                    }),
                    true
                );
                testWithSkip(
                    tests.map((p): Params => {
                        return { ...p, skip: ['lockAt'] };
                    }),
                    true
                );
            });
        });
    });

    describe('Generate Empty Level Tests', () => {
        const nullOverrideDates = { unlockAt: null, dueAt: null, lockAt: null };
        const test = defaultCanvasDateLevels([], []);
        it('Empty Result', () => {
            expect(test.length).toBe(2);
            expect(test.some((x) => x.predicate())).toBeFalse();
            expect(mostSpecificDateSource(test)).toBeUndefined();
        });
        it('Using Fallback Function', async () => {
            const test = defaultCanvasDateLevels([], [], () => Promise.resolve(nullOverrideDates));
            expect(test.length).toBe(3);
            expect(test.some((x) => x.predicate())).toBeTrue();
            expect(test.filter((x) => !x.predicate()).length).toBe(2);
            expect(test.filter((x) => x.predicate()).length).toBe(1);
            expect(await mostSpecificDateSource(test)?.result()).toBe(nullOverrideDates);
        });
    });

    describe('Merging Array of OverrideDates', () => {
        const fakeOverrideAllDiff = allDiff;
        const fakeOverrideAllNull = allNull;
        const fakeOverrideAllEqual = allEqual;
        /** Array with one set of OverrideDates */
        const oneOverride = [fakeOverrideAllNull];
        /** Default Canvas Priority Levels when both Individual and Section Overrides have 1 set of all null dates */
        const oneWithAllNullResult = defaultCanvasDateLevels(oneOverride, oneOverride);
        /** Array with 4 sets of OverrideDates */
        const fourOverrides = [fakeOverrideAllEqual, fakeOverrideAllEqual, fakeOverrideAllDiff, fakeOverrideAllNull];
        /** Default Canvas Priority Levels when both Individual and Section Overrides have 4 set of OverrideDates */
        const fourWithAllNullResult = defaultCanvasDateLevels(fourOverrides, fourOverrides);
        /** Used to check how `defaultCanvasDateLevels` handles empty arguments */
        const zeroOverrides = defaultCanvasDateLevels([], []);
        function equal(a: OverrideDates, b = allNull) {
            return expect(areOverrideDatesEqual(a, b)).toBeTrue();
        }
        it('Individual Level Predicate throws error with more than 1 override', () => {
            expect(() => fourWithAllNullResult[0].predicate()).toThrow();
        });
        it('Individual Level Predicate is true with 1 override', () => {
            expect(oneWithAllNullResult[0].predicate()).toBeTrue();
        });
        it('Individual Level Predicate is false with no overrides', () => {
            expect(zeroOverrides[0].predicate()).toBeFalse();
        });
        it('Individual Level Result reduces to a single `OverrideDates`', async () => {
            equal(await oneWithAllNullResult[0].result(), allNull);
            equal(await fourWithAllNullResult[0].result(), allNull);
        });
        it('Section Level Predicate is false with 0 overrides', () => {
            expect(zeroOverrides[1].predicate()).toBeFalse();
        });
        it('Section Level Predicate is true with 1 or more overrides', () => {
            expect(oneWithAllNullResult[1].predicate()).toBeTrue();
            expect(fourWithAllNullResult[1].predicate()).toBeTrue();
        });
        it('Section Level Result reduces to a single `OverrideDates`', async () => {
            equal(await oneWithAllNullResult[1].result(), allNull);
            equal(await fourWithAllNullResult[1].result(), allNull);
        });
        describe('Brief Array Merge Tests', () => {
            const diffMerges = defaultCanvasDateLevels(
                [fakeOverrideAllEqual, fakeOverrideAllEqual, fakeOverrideAllEqual],
                [fakeOverrideAllEqual, fakeOverrideAllEqual, fakeOverrideAllDiff]
            );
            it('Merging the Same Day results in the Same Day', async () => {
                equal(await diffMerges[0].result(), allEqual);
            });
            it('Merging differing days results in the least Restrictive Days', async () => {
                equal(await diffMerges[1].result(), allDiff);
            });
            it('Merging with Empty Arrays throws Error', async () => {
                await expectAsync(zeroOverrides[0].result()).toBeRejectedWithError();
                await expectAsync(zeroOverrides[1].result()).toBeRejectedWithError();
            });
        });
    });

    describe('Most Specific Dates Test', () => {
        const emptyObject = {} as CheckAndCollect;
        it('Empty Array returns undefined', () => {
            expect(mostSpecificDateSource([])).toBeUndefined();
        });
        it('Array of empty objects returns undefined', () => {
            expect(mostSpecificDateSource([emptyObject, emptyObject, emptyObject])).toBeUndefined();
        });
        const falsePred = {
            name: 'Always Fails',
            predicate: () => false,
            result: () => Promise.resolve({ unlockAt: null, dueAt: null, lockAt: null })
        };
        const truePred = {
            name: 'Always Passes',
            predicate: () => true,
            result: () => Promise.resolve({ unlockAt: null, dueAt: null, lockAt: null })
        };
        const truePred2nd = {
            name: 'Always Passes (2nd)',
            predicate: () => true,
            result: () => Promise.resolve({ unlockAt: null, dueAt: null, lockAt: null })
        };
        it('Single false source returns undefined', () => {
            expect(mostSpecificDateSource([falsePred])).toBeUndefined();
        });
        it('First single true source is returned', () => {
            expect(mostSpecificDateSource([truePred])).toBe(truePred);
            expect(mostSpecificDateSource([truePred, truePred2nd])).toBe(truePred);
            expect(mostSpecificDateSource([falsePred, falsePred, truePred2nd, truePred])).toBe(truePred2nd);
        });
        it('Mix of empty objects and objects returns first true non-empty object', () => {
            expect(
                mostSpecificDateSource([
                    emptyObject,
                    falsePred,
                    emptyObject,
                    falsePred,
                    truePred2nd,
                    emptyObject,
                    emptyObject,
                    truePred
                ])
            ).toBe(truePred2nd);
        });
    });
});

describe('Canvas Check Override Dates Boundaries', () => {
    it('All null dates have no boundaries', () => {
        const result = boundsCheck(allNull);
        expect(Object.values(result).filter((x) => x === -1).length).toEqual(0);
        expect(result).toEqual({});
    });

    it('Null due date has at most `endpoints` boundary', () => {
        const adjusted = { ...allEqual, dueAt: null };
        expect(boundsCheck(adjusted)).toEqual({ endpoints: 0 });
        expect(boundsCheck({ ...adjusted, lockAt: null })).toEqual({});
        expect(boundsCheck({ ...adjusted, unlockAt: null })).toEqual({});
    });

    it('Null unlock date has at most `upperBound`', () => {
        const adjusted = { ...allEqual, unlockAt: null };
        expect(boundsCheck(adjusted)).toEqual({ upperBound: 0 });
        expect(boundsCheck({ ...adjusted, dueAt: null })).toEqual({});
        expect(boundsCheck({ ...adjusted, lockAt: null })).toEqual({});
    });

    it('Null lock date has at most `lowerBound', () => {
        const adjusted = { ...allEqual, lockAt: null };
        expect(boundsCheck(adjusted)).toEqual({ lowerBound: 0 });
        expect(boundsCheck({ ...adjusted, dueAt: null })).toEqual({});
        expect(boundsCheck({ ...adjusted, unlockAt: null })).toEqual({});
    });

    it('All equal dates results in 3 equal boundaries', () => {
        expect(Object.values(boundsCheck(allEqual))).toEqual([0, 0, 0]);
    });

    it('All differing least restrictive dates results in 3 valid boundaries', () => {
        expect(Object.values(boundsCheck(allDiff))).toEqual([1, 1, 1]);
    });

    it('Reversing all differing least restrictive dates results in 3 invalid boundaries', () => {
        const reversed = { unlockAt: allDiff.lockAt, dueAt: allDiff.dueAt, lockAt: allDiff.unlockAt };
        const result = boundsCheck(reversed);
        expect(result).toEqual({ lowerBound: -1, upperBound: -1, endpoints: -1 });
    });

    describe('Fix Override Dates Boundaries', () => {
        it('Valid Boundaries require no fixes and return same argument', () => {
            function validIsEqual(test: OverrideDates, option = true) {
                expect(checkAndFixBoundaries(test, option)).toEqual(test);
                expect(checkAndFixBoundaries(test, option)).toBe(test);
            }
            [allNull, allEqual, allDiff].forEach((x) => {
                validIsEqual(x);
                validIsEqual(x, false);
                expect(checkAndFixBoundaries(x)).toEqual(x);
                expect(checkAndFixBoundaries(x)).toBe(x);
            });
        });

        const future = add(allDiff.dueAt!, { years: 1 });
        const past = add(allDiff.dueAt!, { years: -1 });
        it('Endpoint boundary errors use latest date and return new object', () => {
            function endpointsAreInvalid(test: OverrideDates, option = true, expectedDate?: OverrideDates['dueAt']) {
                if (expectedDate === undefined) {
                    expectedDate = test.unlockAt;
                }
                const expected = {
                    unlockAt: expectedDate,
                    dueAt: test.dueAt === null ? null : expectedDate,
                    lockAt: expectedDate
                };

                expect(checkAndFixBoundaries(test, option)).toEqual(expected);
                expect(checkAndFixBoundaries(test, option)).not.toBe(test);
                expect(checkAndFixBoundaries({ ...test }, option)).not.toBe(test);
            }
            const reversed = { unlockAt: allDiff.lockAt, dueAt: allDiff.dueAt, lockAt: allDiff.unlockAt };
            const tests: ([OverrideDates] | [OverrideDates, OverrideDates['dueAt']])[] = [
                [reversed],
                [reversed, allDiff.lockAt],
                [{ ...reversed, dueAt: null }],
                [{ ...reversed, dueAt: past }],
                [{ ...reversed, dueAt: future }, future]
            ];
            tests.forEach((x) => {
                endpointsAreInvalid(x[0], true, x[0].unlockAt);
                endpointsAreInvalid(x[0], false, x[1]);
            });
        });

        it('Lower Boundary error changes due or unlock', () => {
            function lowerBoundaryInvalid(test: OverrideDates) {
                expect(checkAndFixBoundaries(test, true)).toEqual({ ...test, dueAt: test.unlockAt });
                expect(checkAndFixBoundaries(test, true)).not.toBe(test);
                expect(checkAndFixBoundaries({ ...test }, true)).not.toBe(test);

                expect(checkAndFixBoundaries(test, false)).toEqual({ ...test, unlockAt: test.dueAt });
                expect(checkAndFixBoundaries(test, false)).not.toBe(test);
                expect(checkAndFixBoundaries({ ...test }, false)).not.toBe(test);
            }
            lowerBoundaryInvalid({ ...allDiff, dueAt: past });
        });

        it('Upper Boundary error changes due or lock', () => {
            function upperBoundaryInvalid(test: OverrideDates) {
                expect(checkAndFixBoundaries(test, true)).toEqual({ ...test, dueAt: test.lockAt });
                expect(checkAndFixBoundaries(test, true)).not.toBe(test);
                expect(checkAndFixBoundaries({ ...test }, true)).not.toBe(test);

                expect(checkAndFixBoundaries(test, false)).toEqual({ ...test, lockAt: test.dueAt });
                expect(checkAndFixBoundaries(test, false)).not.toBe(test);
                expect(checkAndFixBoundaries({ ...test }, false)).not.toBe(test);
            }
            upperBoundaryInvalid({ ...allDiff, dueAt: future });
        });
    });
});

describe('Change Canvas Override Dates Tests', () => {
    /** Similar to an empty object, but now each property is defined as undefined */
    const emptyChanges = { unlockAtChange: undefined, dueAtChange: undefined, lockAtChange: undefined };

    it('Make No Change', () => {
        expect(changeOverrideDates(allDiff, {})).toEqual(allDiff);
        expect(changeOverrideDates(allEqual, {})).toEqual(allEqual);
        expect(changeOverrideDates(allNull, {})).toEqual(allNull);
        expect(changeOverrideDates(allDiff, emptyChanges)).toEqual(allDiff);
        expect(changeOverrideDates(allEqual, emptyChanges)).toEqual(allEqual);
        expect(changeOverrideDates(allNull, emptyChanges)).toEqual(allNull);
    });

    it('Make Single Null Change', () => {
        expect(changeOverrideDates(allDiff, { unlockAtChange: null })).toEqual({ ...allDiff, unlockAt: null });
        expect(changeOverrideDates(allEqual, { dueAtChange: null })).toEqual({ ...allEqual, dueAt: null });
        expect(changeOverrideDates(allDiff, { lockAtChange: null })).toEqual({ ...allDiff, lockAt: null });
        expect(changeOverrideDates(allNull, { lockAtChange: null })).toEqual(allNull);
    });

    it('Make 2 Null Changes', () => {
        expect(changeOverrideDates(allDiff, { unlockAtChange: null, dueAtChange: null })).toEqual({
            ...allDiff,
            unlockAt: null,
            dueAt: null
        });
        expect(changeOverrideDates(allEqual, { dueAtChange: null, lockAtChange: null })).toEqual({
            ...allEqual,
            dueAt: null,
            lockAt: null
        });
        expect(changeOverrideDates(allDiff, { unlockAtChange: null, lockAtChange: null })).toEqual({
            ...allDiff,
            unlockAt: null,
            lockAt: null
        });
        expect(changeOverrideDates(allNull, { lockAtChange: null, dueAtChange: null })).toEqual(allNull);
    });

    it('Make 3 Null Changes', () => {
        expect(changeOverrideDates(allDiff, { unlockAtChange: null, dueAtChange: null, lockAtChange: null })).toEqual(
            allNull
        );
        expect(changeOverrideDates(allEqual, { unlockAtChange: null, dueAtChange: null, lockAtChange: null })).toEqual(
            allNull
        );
        expect(changeOverrideDates(allNull, { unlockAtChange: null, dueAtChange: null, lockAtChange: null })).toEqual(
            allNull
        );
    });

    describe('Adding Time Tests', () => {
        const addDuration: DurationData = { years: 1, months: 1, days: 1, hours: 1, minutes: 1, seconds: 1 };
        const addNegDuration: DurationData = Object.fromEntries(
            Object.entries(addDuration).map(([k, v]) => [k, v * -2])
        );
        it('Adding to Null, still results in Null', () => {
            expect(
                changeOverrideDates(allNull, {
                    unlockAtChange: addDuration,
                    dueAtChange: addDuration,
                    lockAtChange: addDuration
                })
            ).toEqual(allNull);
            expect(
                changeOverrideDates(allNull, {
                    unlockAtChange: addNegDuration,
                    dueAtChange: addNegDuration,
                    lockAtChange: addNegDuration
                })
            ).toEqual(allNull);
        });
        it('Passing duration is the same as adding manually', () => {
            expect(
                changeOverrideDates(allDiff, {
                    unlockAtChange: addDuration,
                    dueAtChange: addDuration,
                    lockAtChange: addDuration
                })
            ).toEqual({
                unlockAt: add(allDiff.unlockAt!, addDuration),
                dueAt: add(allDiff.dueAt!, addDuration),
                lockAt: add(allDiff.lockAt!, addDuration)
            });
            expect(
                changeOverrideDates(allDiff, {
                    unlockAtChange: addNegDuration,
                    dueAtChange: addNegDuration,
                    lockAtChange: addNegDuration
                })
            ).toEqual({
                unlockAt: add(allDiff.unlockAt!, addNegDuration),
                dueAt: add(allDiff.dueAt!, addNegDuration),
                lockAt: add(allDiff.lockAt!, addNegDuration)
            });
        });
    });

    describe('Replacing Canvas Override Dates Tests', () => {
        it('Make no Replacements', () => {
            expect(replaceOverrideDates(allNull, {})).toEqual(allNull);
            expect(replaceOverrideDates(allEqual, {})).toEqual(allEqual);
            expect(replaceOverrideDates(allDiff, {})).toEqual(allDiff);
            expect(replaceOverrideDates(allNull, emptyChanges)).toEqual(allNull);
            expect(replaceOverrideDates(allEqual, emptyChanges)).toEqual(allEqual);
            expect(replaceOverrideDates(allDiff, emptyChanges)).toEqual(allDiff);
        });

        it('Replace with Nulls', () => {
            expect(
                replaceOverrideDates(allEqual, { unlockAtChange: null, dueAtChange: null, lockAtChange: null })
            ).toEqual(allNull);
            expect(
                replaceOverrideDates(allDiff, { unlockAtChange: null, dueAtChange: null, lockAtChange: null })
            ).toEqual(allNull);
        });

        it('Replace with Dates', () => {
            expect(
                replaceOverrideDates(allNull, {
                    unlockAtChange: equalDate,
                    dueAtChange: equalDate,
                    lockAtChange: equalDate
                })
            ).toEqual(allEqual);
            expect(
                replaceOverrideDates(allDiff, {
                    unlockAtChange: equalDate,
                    dueAtChange: equalDate,
                    lockAtChange: equalDate
                })
            ).toEqual(allEqual);
            expect(
                replaceOverrideDates(allEqual, {
                    unlockAtChange: equalDate,
                    dueAtChange: equalDate,
                    lockAtChange: equalDate
                })
            ).toEqual(allEqual);
        });

        it('Replace all with Unlock', () => {
            expect(
                replaceOverrideDates(allNull, {
                    unlockAtChange: 'unlockAt',
                    dueAtChange: 'unlockAt',
                    lockAtChange: 'unlockAt'
                })
            ).toEqual(allNull);
            expect(
                replaceOverrideDates(allEqual, {
                    unlockAtChange: 'unlockAt',
                    dueAtChange: 'unlockAt',
                    lockAtChange: 'unlockAt'
                })
            ).toEqual(allEqual);
            expect(
                replaceOverrideDates(allDiff, {
                    unlockAtChange: 'unlockAt',
                    dueAtChange: 'unlockAt',
                    lockAtChange: 'unlockAt'
                })
            ).toEqual({ unlockAt: allDiff.unlockAt, dueAt: allDiff.unlockAt, lockAt: allDiff.unlockAt });
        });

        it('Replace all with Due', () => {
            expect(
                replaceOverrideDates(allNull, {
                    unlockAtChange: 'dueAt',
                    dueAtChange: 'dueAt',
                    lockAtChange: 'dueAt'
                })
            ).toEqual(allNull);
            expect(
                replaceOverrideDates(allEqual, {
                    unlockAtChange: 'dueAt',
                    dueAtChange: 'dueAt',
                    lockAtChange: 'dueAt'
                })
            ).toEqual(allEqual);
            expect(
                replaceOverrideDates(allDiff, {
                    unlockAtChange: 'dueAt',
                    dueAtChange: 'dueAt',
                    lockAtChange: 'dueAt'
                })
            ).toEqual({ unlockAt: allDiff.dueAt, dueAt: allDiff.dueAt, lockAt: allDiff.dueAt });
        });

        it('Replace all with Lock', () => {
            expect(
                replaceOverrideDates(allNull, {
                    unlockAtChange: 'lockAt',
                    dueAtChange: 'lockAt',
                    lockAtChange: 'lockAt'
                })
            ).toEqual(allNull);
            expect(
                replaceOverrideDates(allEqual, {
                    unlockAtChange: 'lockAt',
                    dueAtChange: 'lockAt',
                    lockAtChange: 'lockAt'
                })
            ).toEqual(allEqual);
            expect(
                replaceOverrideDates(allDiff, {
                    unlockAtChange: 'lockAt',
                    dueAtChange: 'lockAt',
                    lockAtChange: 'lockAt'
                })
            ).toEqual({ unlockAt: allDiff.lockAt, dueAt: allDiff.lockAt, lockAt: allDiff.lockAt });
        });
    });
});
