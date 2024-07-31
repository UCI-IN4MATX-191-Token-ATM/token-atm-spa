import { add } from 'date-fns';
import {
    areOverrideDatesEqual,
    mergeOverrideDates,
    mostSpecificDateSource,
    defaultCanvasDateLevels,
    type OverrideDates
} from './canvas-merge-dates';

describe('Canvas Merge Dates Tests', () => {
    const equalDate = new Date();
    const allEqual: OverrideDates = { unlockAt: equalDate, dueAt: equalDate, lockAt: equalDate };
    const allDiff: OverrideDates = {
        unlockAt: add(equalDate, { days: -1 }),
        dueAt: add(equalDate, { days: 1 }),
        lockAt: add(equalDate, { days: 2 })
    };
    const allNull: OverrideDates = { unlockAt: null, dueAt: null, lockAt: null };
    describe('Equality Tests', () => {
        function equal(a: OverrideDates, b?: OverrideDates) {
            return areOverrideDatesEqual(a, b ?? structuredClone(a));
        }
        it('All Equal Dates', () => {
            expect(equal(allEqual)).toBeTrue();
        });
        it('All Equal Nulls', () => {
            expect(equal(allNull)).toBeTrue();
        });
        it('Unequal Dates', () => {
            expect(equal(allEqual, allDiff)).toBeFalse();
            // TODO: Use combination generator to test all possibilities
            expect(equal(allEqual, { ...allDiff, unlockAt: equalDate })).toBeFalse();
            expect(equal(allEqual, { ...allDiff, dueAt: equalDate })).toBeFalse();
            expect(equal(allEqual, { ...allDiff, lockAt: equalDate })).toBeFalse();
            expect(equal(allEqual, { ...allDiff, unlockAt: equalDate, dueAt: equalDate })).toBeFalse();
            expect(equal(allEqual, { ...allDiff, dueAt: equalDate, lockAt: equalDate })).toBeFalse();
            expect(equal(allEqual, { ...allDiff, lockAt: equalDate, unlockAt: equalDate })).toBeFalse();
        });
        it('Equal Dates & Nulls are not Equal', () => {
            expect(equal(allEqual, allNull)).toBeFalse();
            // TODO: Test all combinations programmatically
        });
        it('Unequal Dates & Nulls are not Equal', () => {
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

    const nullOverrideDates = { unlockAt: null, dueAt: null, lockAt: null };
    describe('Generate Empty Level Tests', () => {
        const test = defaultCanvasDateLevels([], []);
        it('Empty Result', () => {
            expect(test.length).toBe(2);
            expect(test.some((x) => x.predicate())).toBeFalse();
            expect(mostSpecificDateSource(test)).toBeNull();
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

    // describe('Individual Level Returned', () => {});
    // describe('Section Level Returned', () => {});

    describe('Most Specific Dates Test', () => {
        it('Empty Array returns null', () => {
            expect(mostSpecificDateSource([])).toBeNull();
        });
        it('Array of nulls returns null', () => {
            expect(mostSpecificDateSource([null, null, null])).toBeNull();
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
        it('Single false source returns null', () => {
            expect(mostSpecificDateSource([falsePred])).toBeNull();
        });
        it('Single true source is returned', () => {
            expect(mostSpecificDateSource([truePred])).toBe(truePred);
            expect(mostSpecificDateSource([truePred, truePred2nd])).toBe(truePred);
        });
        it('First true source is returned', () => {
            expect(mostSpecificDateSource([falsePred, falsePred, truePred2nd, truePred])).toBe(truePred2nd);
        });
        it('Mix of nulls and objects returns first true non-null object', () => {
            expect(mostSpecificDateSource([null, falsePred, null, falsePred, truePred2nd, null, null, truePred])).toBe(
                truePred2nd
            );
        });
    });
});
