// https://stackoverflow.com/a/75396721
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jasmine {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        interface Matchers<T> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            toBeSupersetOf(expected: any): boolean;
        }
    }
}

export const TO_BE_SUPER_SET_OF_MATCHER: jasmine.CustomMatcherFactories = {
    toBeSupersetOf: function (util) {
        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            compare: function (actual: any, expected: any) {
                for (const prop in expected) {
                    if (!Object.hasOwn(actual, prop)) {
                        return {
                            pass: false,
                            message: `Expected ${JSON.stringify(actual)} to have property ${prop}`
                        };
                    }
                    if (!util.equals(actual[prop], expected[prop])) {
                        return {
                            pass: false,
                            message: `Expected $.${prop} = ${actual[prop]} to equal ${expected[prop]}`
                        };
                    }
                }
                return {
                    pass: true,
                    message: `Expected ${JSON.stringify(actual)} not to be a superset of ${JSON.stringify(expected)}`
                };
            }
        };
    }
};
