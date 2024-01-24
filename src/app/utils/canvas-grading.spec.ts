import { addPercentToPointsOrPercentType, addPointsToPercentOrPointsType } from './canvas-grading';

type addingScoreTypesTestingParameters = { input: [number, string, number]; result: string };

function addingScores(
    params: addingScoreTypesTestingParameters,
    func: (add: number, current: string, possible: number) => string,
    asPercent = false
) {
    const [add, current, possible] = params.input;
    it(`Adding ${add}${asPercent ? ' (as percent)' : ''} to ${current} of ${possible}`, () => {
        expect(func(add, current, possible)).toBe(params.result);
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
        { input: [-0.001, '0%', 10], result: '-0.1%' }
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
        { input: [-0.2, '0', 10], result: '-0.2' }
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
