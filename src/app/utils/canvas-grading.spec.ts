import {
    CanvasGradeScorePossible,
    CanvasGradingType,
    UpdatePostedGrade,
    addPercentOrPointsToCanvasGrade,
    addPercentToPointsOrPercentType,
    addPointsToPercentOrPointsType,
    parseCanvasPercentsAndPoints
} from './canvas-grading';

type addingScoreTypesTestingParameters = { input: [number, string, number]; result: string };

function addingScores(
    params: addingScoreTypesTestingParameters,
    func: (add: number, current: string, possible: number, maxDecimals?: number) => string,
    asPercent = false
) {
    const [add, current, possible] = params.input;
    it(`Adding ${add}${asPercent ? ' (as percent)' : ''} to ${current} of ${possible}`, () => {
        expect(func(add, current, possible, 2)).toBe(params.result);
    });
}

describe('Basic Conversions', () => {
    const percentToPercentTests: addingScoreTypesTestingParameters[] = [
        { input: [0.1, '100%', 10], result: '110%' },
        { input: [0.1001, '100%', 10], result: '110.01%' },
        { input: [0.10015, '100%', 10], result: '110.02%' },
        { input: [0.100149, '100%', 10], result: '110.01%' },
        { input: [0.100109, '100%', 10], result: '110.01%' },
        { input: [0.100099, '100%', 10], result: '110.01%' },
        { input: [0.10001, '100%', 10], result: '110%' },
        { input: [1, '100%', 10], result: '200%' },
        { input: [1.2, '100%', 10], result: '220%' },
        { input: [-1.1, '100%', 10], result: '-10%' },
        { input: [-1.2, '100%', 10], result: '-20%' },
        { input: [-1.3, '100%', 10], result: '-30%' },
        { input: [-0.2, '100%', 10], result: '80%' },
        { input: [-0.2, '10%', 10], result: '-10%' },
        { input: [0.1, '100%', 10], result: '110%' },
        // Adding to 0%
        { input: [0.1001, '0%', 10], result: '10.01%' },
        { input: [0.10015, '0%', 10], result: '10.02%' },
        { input: [0.100149, '0%', 10], result: '10.01%' },
        { input: [0.100109, '0%', 10], result: '10.01%' },
        { input: [0.100099, '0%', 10], result: '10.01%' },
        { input: [0.10001, '0%', 10], result: '10%' },
        { input: [1, '0%', 10], result: '100%' },
        { input: [1.2, '0%', 10], result: '120%' },
        { input: [-1.1, '0%', 10], result: '-110%' },
        { input: [-1.2, '0%', 10], result: '-120%' },
        { input: [-1.3, '0%', 10], result: '-130%' },
        { input: [-0.2, '0%', 10], result: '-20%' },
        { input: [-0.2, '0%', 10], result: '-20%' },
        { input: [-0.001, '0%', 10], result: '-0.1%' },
        { input: [1.2, '-10%', 10], result: '110%' },
        { input: [-1.1, '-10%', 10], result: '-120%' },
        { input: [-1.2, '-10%', 10], result: '-130%' },
        { input: [-1.3, '-10%', 10], result: '-140%' },
        { input: [-0.2, '-10%', 10], result: '-30%' },
        { input: [-0.2, '-10%', 10], result: '-30%' },
        { input: [-0.001, '-10%', 10], result: '-10.1%' }
    ];

    percentToPercentTests.forEach((params) => {
        addingScores(params, addPercentToPointsOrPercentType, true);
    });

    const pointsToPointsTests: addingScoreTypesTestingParameters[] = [
        // # Adding to 100 possiblePoints
        // Adding to 100 of 100
        { input: [0.1, '100', 100], result: '100.1' },
        { input: [0.101, '100', 100], result: '100.1' },
        { input: [0.115, '100', 100], result: '100.12' },
        { input: [0.1149, '100', 100], result: '100.11' },
        { input: [0.1109, '100', 100], result: '100.11' },
        { input: [0.1099, '100', 100], result: '100.11' },
        { input: [0.101, '100', 100], result: '100.1' },
        { input: [1, '100', 100], result: '101' },
        { input: [1.2, '100', 100], result: '101.2' },
        { input: [-1.1, '100', 100], result: '98.9' },
        { input: [-1.2, '100', 100], result: '98.8' },
        { input: [-1.3, '100', 100], result: '98.7' },
        { input: [-0.2, '100', 100], result: '99.8' },
        { input: [-0.2, '10', 100], result: '9.8' },
        { input: [0.1, '10', 100], result: '10.1' },
        // Adding to 0 of 100
        { input: [0.11, '0', 100], result: '0.11' },
        { input: [0.115, '0', 100], result: '0.12' },
        { input: [0.1149, '0', 100], result: '0.11' },
        { input: [0.1109, '0', 100], result: '0.11' },
        { input: [0.1099, '0', 100], result: '0.11' },
        { input: [0.101, '0', 100], result: '0.1' },
        { input: [1, '0', 100], result: '1' },
        { input: [1.2, '0', 100], result: '1.2' },
        { input: [-1.1, '0', 100], result: '-1.1' },
        { input: [-1.2, '0', 100], result: '-1.2' },
        { input: [-1.3, '0', 100], result: '-1.3' },
        { input: [-0.2, '0', 100], result: '-0.2' },
        // # Adding to 10 possiblePoints
        // Adding to 10 of 10
        { input: [0.1, '10', 10], result: '10.1' },
        { input: [0.11, '10', 10], result: '10.11' },
        { input: [0.115, '10', 10], result: '10.12' },
        { input: [0.1149, '10', 10], result: '10.11' },
        { input: [0.1109, '10', 10], result: '10.11' },
        { input: [0.1099, '10', 10], result: '10.11' },
        { input: [0.101, '10', 10], result: '10.1' },
        { input: [1, '10', 10], result: '11' },
        { input: [1.2, '10', 10], result: '11.2' },
        { input: [-1.1, '10', 10], result: '8.9' },
        { input: [-1.2, '10', 10], result: '8.8' },
        { input: [-1.3, '10', 10], result: '8.7' },
        { input: [-0.2, '10', 10], result: '9.8' },
        { input: [-0.2, '1', 10], result: '0.8' },
        { input: [0.1, '1', 10], result: '1.1' },
        // Adding to 0 of 10
        { input: [0.11, '0', 10], result: '0.11' },
        { input: [0.115, '0', 10], result: '0.12' },
        { input: [0.1149, '0', 10], result: '0.11' },
        { input: [0.1109, '0', 10], result: '0.11' },
        { input: [0.1099, '0', 10], result: '0.11' },
        { input: [0.101, '0', 10], result: '0.1' },
        { input: [1, '0', 10], result: '1' },
        { input: [1.2, '0', 10], result: '1.2' },
        { input: [-1.1, '0', 10], result: '-1.1' },
        { input: [-1.2, '0', 10], result: '-1.2' },
        { input: [-1.3, '0', 10], result: '-1.3' },
        { input: [-0.2, '0', 10], result: '-0.2' },
        { input: [0.222, '0', 0], result: '0.22' }
    ];

    pointsToPointsTests.forEach((params) => {
        addingScores(params, addPointsToPercentOrPointsType, false);
    });
});

describe('Cross Type Conversions', () => {
    const percentToPointsTests: addingScoreTypesTestingParameters[] = [
        // # Adding to 100 possiblePoints
        // Adding to 100 of 100
        { input: [0.1, '100', 100], result: '110' },
        { input: [0.1001, '100', 100], result: '110.01' },
        { input: [0.10015, '100', 100], result: '110.02' },
        { input: [0.100149, '100', 100], result: '110.01' },
        { input: [0.100109, '100', 100], result: '110.01' },
        { input: [0.100099, '100', 100], result: '110.01' },
        { input: [0.10001, '100', 100], result: '110' },
        { input: [1, '100', 100], result: '200' },
        { input: [1.2, '100', 100], result: '220' },
        { input: [-1.1, '100', 100], result: '-10' },
        { input: [-1.2, '100', 100], result: '-20' },
        { input: [-1.3, '100', 100], result: '-30' },
        { input: [-0.2, '100', 100], result: '80' },
        { input: [-0.2, '10', 100], result: '-10' },
        { input: [0.1, '10', 100], result: '20' },
        // Adding to 0 of 100
        { input: [0.1001, '0', 100], result: '10.01' },
        { input: [0.10015, '0', 100], result: '10.02' },
        { input: [0.100149, '0', 100], result: '10.01' },
        { input: [0.100109, '0', 100], result: '10.01' },
        { input: [0.100099, '0', 100], result: '10.01' },
        { input: [0.10001, '0', 100], result: '10' },
        { input: [1, '0', 100], result: '100' },
        { input: [1.2, '0', 100], result: '120' },
        { input: [-1.1, '0', 100], result: '-110' },
        { input: [-1.2, '0', 100], result: '-120' },
        { input: [-1.3, '0', 100], result: '-130' },
        { input: [-0.2, '0', 100], result: '-20' },
        // # Adding to 10 possiblePoints
        // Adding to 10 of 10
        { input: [0.1, '10', 10], result: '11' },
        { input: [0.101, '10', 10], result: '11.01' },
        { input: [0.1015, '10', 10], result: '11.02' },
        { input: [0.10149, '10', 10], result: '11.01' },
        { input: [0.10109, '10', 10], result: '11.01' },
        { input: [0.10099, '10', 10], result: '11.01' },
        { input: [0.1001, '10', 10], result: '11' },
        { input: [1, '10', 10], result: '20' },
        { input: [1.2, '10', 10], result: '22' },
        { input: [-1.1, '10', 10], result: '-1' },
        { input: [-1.2, '10', 10], result: '-2' },
        { input: [-1.3, '10', 10], result: '-3' },
        { input: [-0.2, '10', 10], result: '8' },
        { input: [-0.2, '1', 10], result: '-1' },
        { input: [0.1, '1', 10], result: '2' },
        // Adding to 0 of 10
        { input: [0.101, '0', 10], result: '1.01' },
        { input: [0.1015, '0', 10], result: '1.02' },
        { input: [0.10149, '0', 10], result: '1.01' },
        { input: [0.10109, '0', 10], result: '1.01' },
        { input: [0.10099, '0', 10], result: '1.01' },
        { input: [0.1001, '0', 10], result: '1' },
        { input: [1, '0', 10], result: '10' },
        { input: [1.2, '0', 10], result: '12' },
        { input: [-1.1, '0', 10], result: '-11' },
        { input: [-1.2, '0', 10], result: '-12' },
        { input: [-1.3, '0', 10], result: '-13' },
        { input: [-0.2, '0', 10], result: '-2' }
    ];

    percentToPointsTests.forEach((params) => {
        addingScores(params, addPercentToPointsOrPercentType, true);
    });

    const pointsToPercentTests: addingScoreTypesTestingParameters[] = [
        // # Adding to 100 possiblePoints
        // Adding to 100% of 100
        { input: [0.1, '100%', 100], result: '100.1%' },
        { input: [0.101, '100%', 100], result: '100.1%' },
        { input: [0.115, '100%', 100], result: '100.12%' },
        { input: [0.149, '100%', 100], result: '100.15%' },
        { input: [0.109, '100%', 100], result: '100.11%' },
        { input: [0.199, '100%', 100], result: '100.2%' },
        { input: [0.101, '100%', 100], result: '100.1%' },
        { input: [1, '100%', 100], result: '101%' },
        { input: [1.2, '100%', 100], result: '101.2%' },
        { input: [-1.1, '100%', 100], result: '98.9%' },
        { input: [-1.2, '100%', 100], result: '98.8%' },
        { input: [-1.3, '100%', 100], result: '98.7%' },
        { input: [-0.2, '100%', 100], result: '99.8%' },
        { input: [-0.2, '10%', 100], result: '9.8%' },
        { input: [0.1, '10%', 100], result: '10.1%' },
        // Adding to 0% of 100
        { input: [0.11, '0%', 100], result: '0.11%' },
        { input: [0.115, '0%', 100], result: '0.12%' },
        { input: [0.1149, '0%', 100], result: '0.11%' },
        { input: [0.1109, '0%', 100], result: '0.11%' },
        { input: [0.1099, '0%', 100], result: '0.11%' },
        { input: [0.101, '0%', 100], result: '0.1%' },
        { input: [1, '0%', 100], result: '1%' },
        { input: [1.2, '0%', 100], result: '1.2%' },
        { input: [-1.1, '0%', 100], result: '-1.1%' },
        { input: [-1.2, '0%', 100], result: '-1.2%' },
        { input: [-1.3, '0%', 100], result: '-1.3%' },
        { input: [-0.2, '0%', 100], result: '-0.2%' },
        // # Adding to 10 possiblePoints
        // Adding to 100% of 10
        { input: [0.1, '100%', 10], result: '101%' },
        { input: [0.11, '100%', 10], result: '101.1%' },
        { input: [0.115, '100%', 10], result: '101.15%' },
        { input: [0.1149, '100%', 10], result: '101.15%' },
        { input: [0.1109, '100%', 10], result: '101.11%' },
        { input: [0.1099, '100%', 10], result: '101.1%' },
        { input: [0.101, '100%', 10], result: '101.01%' },
        { input: [1, '100%', 10], result: '110%' },
        { input: [1.2, '100%', 10], result: '112%' },
        { input: [-1.1, '100%', 10], result: '89%' },
        { input: [-1.2, '100%', 10], result: '88%' },
        { input: [-1.3, '100%', 10], result: '87%' },
        { input: [-0.2, '100%', 10], result: '98%' },
        { input: [-0.2, '10%', 10], result: '8%' },
        { input: [0.1, '10%', 10], result: '11%' },
        // Adding to 0% of 10
        { input: [0.11, '0%', 10], result: '1.1%' },
        { input: [0.115, '0%', 10], result: '1.15%' },
        { input: [0.1149, '0%', 10], result: '1.15%' },
        { input: [0.1109, '0%', 10], result: '1.11%' },
        { input: [0.1099, '0%', 10], result: '1.1%' },
        { input: [0.101, '0%', 10], result: '1.01%' },
        { input: [1, '0%', 10], result: '10%' },
        { input: [1.2, '0%', 10], result: '12%' },
        { input: [-1.1, '0%', 10], result: '-11%' },
        { input: [-1.2, '0%', 10], result: '-12%' },
        { input: [-1.3, '0%', 10], result: '-13%' },
        { input: [-0.2, '0%', 10], result: '-2%' }
    ];

    pointsToPercentTests.forEach((params) => {
        addingScores(params, addPointsToPercentOrPointsType, false);
    });
});

describe('Testing Canvas Score Inputs that should fail to parse.', () => {
    const parseFailures = [
        '',
        '200%A',
        'a100',
        '55a%',
        'a',
        'A',
        '0xffe',
        '1,000',
        '1 000',
        '1_000_000',
        '1.0.0',
        '%%0',
        '%0%',
        '0%0%',
        '0.0%0.0',
        '0%0.0%0',
        '0-10.0',
        ' -.20',
        '--20',
        '-100.00%%',
        '-abc.qwe',
        '205-02'
    ];

    function testNaN(testString: string) {
        it(`${testString} should not be a number.`, () => {
            expect(parseCanvasPercentsAndPoints(testString)).toBeNaN();
        });
    }

    parseFailures.forEach(testNaN);
});

type addingScoreTypesWithMultiDenomTestingParameters = {
    add: string;
    target: CanvasGradeScorePossible;
    basedOn?: number;
    result: UpdatePostedGrade | [UpdatePostedGrade, UpdatePostedGrade];
    matchingBasedOnScore?: number;
};

function addingMultiDenomScores(
    params: addingScoreTypesWithMultiDenomTestingParameters,
    func: typeof addPercentOrPointsToCanvasGrade
) {
    const {
        add,
        target: { gradeType, grade, score, pointsPossible },
        basedOn,
        result,
        matchingBasedOnScore
    } = params;
    const test = (
        p1: CanvasGradeScorePossible['pointsPossible'] | undefined,
        p2: CanvasGradeScorePossible['pointsPossible'] | undefined,
        r: string,
        s2?: number
    ) => {
        const usedScore = s2 ?? score;
        const gradeTypeScoreFirst = `${gradeType === 'points' ? score : grade}|${
            gradeType === 'points' ? grade : score
        }`;
        it(`Adding ${add} of ${p2} to ${gradeTypeScoreFirst} of ${p1}.`, () => {
            expect(
                func(add, { gradeType, grade, score: usedScore, pointsPossible: p1 ?? null }, p2 ?? undefined)
                    .postedGrade
            ).toBe(r);
        });
    };
    test(pointsPossible, basedOn, Array.isArray(result) ? result[0].postedGrade : result.postedGrade);
    test(
        basedOn,
        pointsPossible,
        Array.isArray(result) ? result[1].postedGrade : result.postedGrade,
        matchingBasedOnScore
    );
}

function noMes(postedGrade: string): UpdatePostedGrade {
    return { postedGrade, updateMessage: '' };
}
function setType(
    input: [
        CanvasGradeScorePossible['grade'],
        CanvasGradeScorePossible['score'],
        CanvasGradeScorePossible['pointsPossible']
    ],
    gradeType: keyof typeof CanvasGradingType
): CanvasGradeScorePossible {
    const [grade, score, pointsPossible] = input;
    return { gradeType, grade, score, pointsPossible };
}
function percent(input: Parameters<typeof setType>[0]) {
    return setType(input, 'percent');
}
function points(input: Parameters<typeof setType>[0]) {
    return setType(input, 'points');
}

describe('Test that converting from different denominators preserves the actual intended value.', () => {
    const pointsToPointsTests: addingScoreTypesWithMultiDenomTestingParameters[] = [
        { add: '1', target: points(['50%', 10, 20]), result: noMes('11'), basedOn: 60 },
        { add: '3', target: points(['55%', 11, 20]), result: noMes('14'), basedOn: 60 },
        { add: '3', target: points(['70%', 14, 20]), result: noMes('17'), basedOn: 60 },
        { add: '1', target: points(['10', 10, 0]), result: noMes('11'), basedOn: 60 },
        { add: '3', target: points(['11', 11, 0]), result: noMes('14'), basedOn: 60 },
        { add: '3', target: points(['14', 14, 0]), result: noMes('17'), basedOn: 60 },
        { add: '1', target: points(['50%', 10, 20]), result: noMes('11'), basedOn: 20 },
        { add: '3', target: points(['55%', 11, 20]), result: noMes('14'), basedOn: 20 },
        { add: '3', target: points(['70%', 14, 20]), result: noMes('17'), basedOn: 20 },
        { add: '1', target: points(['10', 10, 0]), result: noMes('11'), basedOn: 20 },
        { add: '3', target: points(['11', 11, 0]), result: noMes('14'), basedOn: 20 },
        { add: '3', target: points(['14', 14, 0]), result: noMes('17'), basedOn: 20 },
        { add: '5', target: points(['14', 14, 0]), result: noMes('19'), basedOn: 20 }
    ];

    pointsToPointsTests.forEach((params) => {
        addingMultiDenomScores(params, addPercentOrPointsToCanvasGrade);
    });

    const percentToPercentSimpleTests: addingScoreTypesWithMultiDenomTestingParameters[] = [
        { add: '10%', target: percent(['50%', 10, 20]), result: noMes('60%'), basedOn: 20 },
        { add: '30%', target: percent(['50%', 10, 20]), result: noMes('80%'), basedOn: 20 },
        { add: '30%', target: percent(['54%', 10.8, 20]), result: noMes('84%'), basedOn: 20 }
    ];

    percentToPercentSimpleTests.forEach((params) => {
        addingMultiDenomScores(params, addPercentOrPointsToCanvasGrade);
    });

    const percentToPercentTests: addingScoreTypesWithMultiDenomTestingParameters[] = [
        {
            add: '10%',
            target: percent(['50%', 15, 30]),
            result: [noMes('70%'), noMes('55%')],
            basedOn: 60,
            matchingBasedOnScore: 30
        },
        {
            add: '30%',
            target: percent(['50%', 10, 20]),
            result: [noMes('140%'), noMes('60%')],
            basedOn: 60,
            matchingBasedOnScore: 30
        },
        {
            add: '30%',
            target: percent(['54%', 10.8, 20]),
            result: [noMes('144%'), noMes('64%')],
            basedOn: 60,
            matchingBasedOnScore: 32.4
        }
    ];

    percentToPercentTests.forEach((params) => {
        addingMultiDenomScores(params, addPercentOrPointsToCanvasGrade);
    });

    const pointsToPercentTests: addingScoreTypesWithMultiDenomTestingParameters[] = [
        {
            add: '6',
            target: percent(['50%', 10, 20]),
            result: [noMes('80%'), noMes('60%')],
            basedOn: 60,
            matchingBasedOnScore: 30
        },
        {
            add: '3',
            target: percent(['50%', 10, 20]),
            result: [noMes('65%'), noMes('55%')],
            basedOn: 60,
            matchingBasedOnScore: 30
        }
    ];
    pointsToPercentTests.forEach((params) => {
        addingMultiDenomScores(params, addPercentOrPointsToCanvasGrade);
    });

    // Add tests for all possibly nullish values (null values treated as 0)
    const nullishValuesTests: addingScoreTypesWithMultiDenomTestingParameters[] = [
        { add: '30%', target: percent([null, 10.8, 20]), result: noMes('16.8'), basedOn: 20 },
        { add: '30%', target: percent(['54%', null, 20]), result: noMes('84%'), basedOn: 20 },
        { add: '30%', target: percent(['54%', 10.8, null]), result: [noMes('16.8'), noMes('84%')], basedOn: 20 },
        { add: '30%', target: percent(['54%', 10.8, 20]), result: [noMes('84%'), noMes('16.8')], basedOn: undefined },
        { add: '30%', target: points([null, 10.8, 20]), result: noMes('16.8'), basedOn: 20 },
        { add: '30%', target: points(['54%', null, 20]), result: noMes('84%'), basedOn: 20 },
        { add: '30%', target: points(['54%', 10.8, null]), result: [noMes('16.8'), noMes('84%')], basedOn: 20 },
        { add: '30%', target: points(['54%', 10.8, 20]), result: [noMes('84%'), noMes('16.8')], basedOn: undefined },
        { add: '30%', target: percent(['54%', 10.8, null]), result: noMes('54%'), basedOn: undefined },
        { add: '30%', target: points(['54%', 10.8, null]), result: noMes('10.8'), basedOn: undefined },
        { add: '6', target: percent([null, 10.8, 20]), result: noMes('16.8'), basedOn: 20 },
        { add: '6', target: percent(['54%', null, 20]), result: noMes('84%'), basedOn: 20 },
        { add: '6', target: percent(['54%', 10.8, null]), result: [noMes('16.8'), noMes('84%')], basedOn: 20 },
        { add: '6', target: percent(['54%', 10.8, 20]), result: [noMes('84%'), noMes('16.8')], basedOn: undefined },
        { add: '6', target: points([null, 10.8, 20]), result: noMes('16.8'), basedOn: 20 },
        { add: '6', target: points(['54%', null, 20]), result: noMes('84%'), basedOn: 20 },
        { add: '6', target: points(['54%', 10.8, null]), result: [noMes('16.8'), noMes('84%')], basedOn: 20 },
        { add: '6', target: points(['54%', 10.8, 20]), result: [noMes('84%'), noMes('16.8')], basedOn: undefined },
        { add: '6', target: percent(['54%', 10.8, null]), result: noMes('16.8'), basedOn: undefined },
        { add: '6', target: points(['54%', 10.8, null]), result: noMes('16.8'), basedOn: undefined },
        { add: '30%', target: percent([null, 10.8, null]), result: noMes('10.8'), basedOn: undefined },
        { add: '30%', target: percent(['54%', null, null]), result: noMes('54%'), basedOn: undefined },
        { add: '30%', target: percent([null, null, null]), result: noMes('0'), basedOn: undefined },
        { add: '30%', target: points(['null', 10.8, null]), result: noMes('10.8'), basedOn: undefined },
        { add: '30%', target: points(['54%', null, null]), result: noMes('54%'), basedOn: undefined },
        { add: '30%', target: points([null, null, null]), result: noMes('0'), basedOn: undefined },
        { add: '', target: percent([null, null, null]), result: noMes('0'), basedOn: undefined },
        { add: '', target: points([null, null, null]), result: noMes('0'), basedOn: undefined }
    ];

    nullishValuesTests.forEach((params) => {
        addingMultiDenomScores(params, addPercentOrPointsToCanvasGrade);
    });

    // TODO: Add tests for checking most simple/precise posted grades
    const chooseMostPreciseTests: addingScoreTypesWithMultiDenomTestingParameters[] = [
        {
            add: '1',
            target: percent(['50%', 10, 20]),
            result: [noMes('55%'), noMes('31')],
            basedOn: 60,
            matchingBasedOnScore: 30
        },
        {
            add: '3',
            target: percent([null, 10, 11]),
            result: [noMes('13'), noMes('33')],
            basedOn: 33,
            matchingBasedOnScore: 30
        },
        {
            add: '33%',
            target: percent(['0%', 0, 3]),
            result: [noMes('660%'), noMes('1.65%')],
            basedOn: 60,
            matchingBasedOnScore: 0
        },
        {
            add: '33%',
            target: points(['0%', 0, 3]),
            result: [noMes('660%'), noMes('0.99')],
            basedOn: 60,
            matchingBasedOnScore: 0
        },
        {
            add: '1',
            target: percent([null, null, 20]),
            result: [noMes('5%'), noMes('31')],
            basedOn: 60,
            matchingBasedOnScore: 30
        },
        {
            add: '2.55',
            target: percent([null, null, 20]),
            result: [noMes('12.75%'), noMes('32.55')],
            basedOn: 60,
            matchingBasedOnScore: 30
        },
        {
            add: '2.555',
            target: percent([null, null, 20]),
            result: [noMes('12.775%'), noMes('32.555')],
            basedOn: 60,
            matchingBasedOnScore: 30
        },
        {
            add: '2.55',
            target: points(['10%', null, 20]),
            result: [noMes('22.75%'), noMes('8.55')],
            basedOn: 60,
            matchingBasedOnScore: 6
        },
        {
            add: '2.55',
            target: percent(['10%', null, 20]),
            result: [noMes('22.75%'), noMes('14.25%')],
            basedOn: 60,
            matchingBasedOnScore: 6
        },
        {
            add: '2.55',
            target: points([null, 2, 20]),
            result: [noMes('4.55'), noMes('8.55')],
            basedOn: 60,
            matchingBasedOnScore: 6
        },
        {
            add: '2.55',
            target: percent([null, 2, 20]),
            result: [noMes('4.55'), noMes('8.55')],
            basedOn: 60,
            matchingBasedOnScore: 6
        }
    ];

    chooseMostPreciseTests.forEach((params) => {
        addingMultiDenomScores(params, addPercentOrPointsToCanvasGrade);
    });

    const becomesZero: addingScoreTypesWithMultiDenomTestingParameters[] = [
        // What does canvas do with a percentage grade for a 0 possible point assignment?
        // Answer: updates to score: 0, grade: '0%'
        // For 5 points grade to a 0 of 0 possible point assignment?
        // Answer: updates to score: 5, grade: '5'
        { add: '10%', target: percent(['50%', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '30%', target: percent(['50%', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '30%', target: percent(['54%', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '10%', target: percent(['0', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '30%', target: percent(['0', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '10%', target: percent(['0%', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '30%', target: percent(['0%', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '10%', target: percent(['1', 1, 0]), result: noMes('1'), basedOn: 0 },
        { add: '30%', target: percent(['1', 1, 0]), result: noMes('1'), basedOn: 0 },
        { add: '0', target: percent(['0%', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '0', target: percent(['0', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '10%', target: points(['50%', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '30%', target: points(['50%', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '30%', target: points(['54%', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '10%', target: points(['0', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '30%', target: points(['0', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '10%', target: points(['0%', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '30%', target: points(['0%', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '10%', target: points(['1', 1, 0]), result: noMes('1'), basedOn: 0 },
        { add: '30%', target: points(['1', 1, 0]), result: noMes('1'), basedOn: 0 },
        { add: '0', target: points(['0%', 0, 0]), result: noMes('0'), basedOn: 0 },
        { add: '0', target: points(['0', 0, 0]), result: noMes('0'), basedOn: 0 }
    ];

    becomesZero.forEach((params) => {
        addingMultiDenomScores(params, addPercentOrPointsToCanvasGrade);
    });
});

type testingUpdateMessageParams = {
    add: string;
    target: CanvasGradeScorePossible;
    basedOn?: number;
    r: string;
    rMes: string;
};

function testingUpdateMessage(params: testingUpdateMessageParams) {
    const {
        add,
        target: { gradeType, grade, score, pointsPossible },
        basedOn,
        r,
        rMes
    } = params;
    const gradeTypeScoreFirst = `${gradeType === 'points' ? score : grade}|${gradeType === 'points' ? grade : score}`;
    it(`Correct message for adding ${add} of ${basedOn} to ${gradeTypeScoreFirst} of ${pointsPossible}`, () => {
        const { postedGrade: result, updateMessage: message } = addPercentOrPointsToCanvasGrade(
            add,
            { gradeType, grade, score, pointsPossible },
            basedOn
        );
        expect(result).toBe(r);
        expect(message).toBe(rMes);
    });
}
function testTemplate(a: string, b: string, orig: string, final: string) {
    return `Added ${a} to ${b}\nChange: ${orig} => ${final}`;
}

// Tests for checking the update message when adding to an assignment score.
describe('Check Update Messages are as expected.', () => {
    const messages = [
        testTemplate('10', '0 out of 0 points', '0', '10'),
        testTemplate('10 points', '0% of 0 points', '0', '10'),
        testTemplate('10%', '50% of 10 points', '50%', '60%'),
        testTemplate('1', '1 out of 10 points', '1', '2'),
        testTemplate('100% of 1 total point', '1 out of 10 points', '1', '2'),
        testTemplate('0% of 0 total points', '0% of 0 points', '0', '0'),
        testTemplate('1 point', '20% of 10 points', '20%', '30%'),
        testTemplate('1', '2 out of 10 points', '2', '3'),
        testTemplate('50% of 0 total points', '102 out of 10 points', '102', '102'),
        testTemplate('0.0 points', '1020% of 10 points', '1020%', '1020%'),
        testTemplate('0.1 points', '0% of 0 points', '0', '0.1'),
        testTemplate('1 point', '0% of 0 points', '0', '1'),
        testTemplate('1.0 points', '0% of 0 points', '0', '1')
    ];
    const posted = ['10', '10', '60%', '2', '2', '0', '30%', '3', '102', '1020%', '0.1', '1', '1'];
    const inputs = [
        { add: '10', target: points(['0%', 0, 0]), basedOn: undefined },
        { add: '10', target: percent(['0%', 0, 0]), basedOn: 1 },
        { add: '10%', target: percent(['50%', 5, 10]), basedOn: undefined },
        { add: '1', target: points(['1%', 1, 10]), basedOn: 0 },
        { add: '100%', target: points(['10%', 1, 10]), basedOn: 1 },
        { add: '0%', target: percent(['0%', 0, 0]), basedOn: 0 },
        { add: '1', target: percent(['20%', 2, 10]), basedOn: 200 },
        { add: '1', target: points(['20%', 2, 10]), basedOn: 200 },
        { add: '50%', target: points(['1020%', 102, 10]), basedOn: 0 },
        { add: '0.0', target: percent(['1020%', 102, 10]), basedOn: undefined },
        { add: '0.1', target: percent(['0%', 0, 0]), basedOn: 1 },
        { add: '1', target: percent(['0%', 0, 0]), basedOn: 1 },
        { add: '1.0', target: percent(['0%', 0, 0]), basedOn: 1 }
    ];

    messages.forEach((v, i) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { add, target, basedOn } = inputs[i]!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        testingUpdateMessage({ add, target, basedOn, r: posted[i]!, rMes: v });
    });
});

// TODO: Add tests for collectPointsPossible
//       - null/NaN 'points_possible', null skip value, unique skip property, etc.
