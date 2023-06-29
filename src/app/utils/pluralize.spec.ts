import { countAndNoun } from './pluralize';

type CountAndNounTestingParameters = { input: [number, string]; result: string };

describe('Basic Pluralization', () => {
    const parameters: CountAndNounTestingParameters[] = [
        { input: [1, 'request'], result: '1 request' },
        { input: [0, 'request'], result: '0 requests' },
        { input: [2, 'request'], result: '2 requests' },
        { input: [1, 'submission'], result: '1 submission' },
        { input: [0, 'submission'], result: '0 submissions' },
        { input: [2, 'submission'], result: '2 submissions' },
        { input: [1, 'student'], result: '1 student' },
        { input: [0, 'student'], result: '0 students' },
        { input: [2, 'student'], result: '2 students' },
        { input: [1, 'record'], result: '1 record' },
        { input: [0, 'record'], result: '0 records' },
        { input: [2, 'record'], result: '2 records' },
        { input: [1, 'token option group'], result: '1 token option group' },
        { input: [0, 'token option group'], result: '0 token option groups' },
        { input: [2, 'token option group'], result: '2 token option groups' }
    ];

    parameters.forEach((parameter) => {
        const [count, noun] = parameter.input;
        it(`${count} & '${noun}' should be '${parameter.result}'`, () => {
            expect(countAndNoun(count, noun)).toBe(parameter.result);
        });
    });
});
