import { isLeft } from 'fp-ts/lib/Either';
import {
    DescriptionDef,
    ITokenOption,
    RawTokenOptionMixinData,
    TokenOptionMixin,
    TokenOptionMixinData,
    TokenOptionMixinDataDef
} from './token-option-mixin';
import { Base64 } from 'js-base64';
import type { TokenOptionGroup } from 'app/data/token-option-group';

describe('TokenOptionMixin', () => {
    describe('DescriptionDef', () => {
        const validValues: string[] = ['A', 'AA', ''];
        const validRawValues: string[] = validValues.map((v) => Base64.encode(v));
        const invalidRawValues = [0, []];
        const invalidValues = invalidRawValues;

        validRawValues.forEach((value) => {
            it(`should decode sucessfully with base64 encoded form of string ${value}`, () => {
                const result = DescriptionDef.decode(value);
                expect(isLeft(result)).toBeFalse();
                if (!isLeft(result)) expect(result.right).toEqual(Base64.decode(value));
            });
        });

        it('should decode to empty string with undefined', () => {
            const result = DescriptionDef.decode(undefined);
            expect(isLeft(result)).toBeFalse();
            if (!isLeft(result)) expect(result.right).toEqual('');
        });

        invalidRawValues.forEach((value) => {
            it(`should fail to decode with invalid raw value ${JSON.stringify(value)}`, () => {
                const result = DescriptionDef.decode(value);
                expect(isLeft(result)).toBeTrue();
            });
        });

        validValues.forEach((value) => {
            it(`should validate successfully with string ${value}`, () => {
                expect(DescriptionDef.is(value)).toBeTrue();
            });
        });

        invalidValues.forEach((value) => {
            it(`should fail to validate with invalid value ${JSON.stringify(value)}`, () => {
                expect(DescriptionDef.is(value)).toBeFalse();
            });
        });

        validValues.forEach((value) => {
            it(`should encode successfully to base64 encoded form with string ${value}`, () => {
                const result = DescriptionDef.encode(value);
                expect(result).toEqual(Base64.encode(value));
            });
        });
    });

    describe('TokenOptionMixinDataDef', () => {
        const validValues: TokenOptionMixinData[] = [
            {
                type: 'basic',
                id: 1,
                name: 'A',
                description: '',
                tokenBalanceChange: 1,
                isMigrating: undefined
            },
            {
                type: 'earn-by-quiz',
                id: 2,
                name: 'B',
                description: 'Test description',
                tokenBalanceChange: 2,
                isMigrating: true
            }
        ];
        const validRawValuesPair: [TokenOptionMixinData, RawTokenOptionMixinData][] = validValues.map((v) => {
            return [
                v,
                {
                    ...v,
                    description: v.description ? Base64.encode(v.description) : undefined
                }
            ];
        });
        const invalidValues = [
            {},
            {
                type: undefined,
                id: 1,
                name: 'A',
                description: 'Test description',
                tokenBalanceChange: 1
            },
            {
                type: undefined,
                id: '1',
                name: 1,
                description: 1,
                tokenBalanceChange: '1'
            }
        ];
        const invalidRawValues = invalidValues.map((v) => {
            return {
                ...v,
                description: typeof v.description == 'string' ? Base64.encode(v.description) : v.description
            };
        });

        validRawValuesPair.forEach(([expected, value]) => {
            it(`should decode sucessfully with valid raw value ${JSON.stringify(value)}`, () => {
                const result = TokenOptionMixinDataDef.decode(value);
                expect(isLeft(result)).toBeFalse();
                if (!isLeft(result)) expect(result.right).toEqual(expected);
            });
        });

        invalidRawValues.forEach((value) => {
            it(`should fail to decode with invalid raw value ${JSON.stringify(value)}`, () => {
                const result = TokenOptionMixinDataDef.decode(value);
                expect(isLeft(result)).toBeTrue();
            });
        });

        validValues.forEach((value) => {
            it(`should validate successfully with valid value ${JSON.stringify(value)}`, () => {
                expect(TokenOptionMixinDataDef.is(value)).toBeTrue();
            });
        });

        invalidValues.forEach((value) => {
            it(`should fail to validate with invalid value ${JSON.stringify(value)}`, () => {
                expect(TokenOptionMixinDataDef.is(value)).toBeFalse();
            });
        });

        validRawValuesPair.forEach(([value, expected]) => {
            it(`should encode successfully with valid value ${JSON.stringify(value)}`, () => {
                const result = TokenOptionMixinDataDef.encode(value);
                expect(result).toEqual({
                    ...expected,
                    description: expected.description ?? ''
                });
            });
        });
    });

    describe('TokenOptionMixin', () => {
        let tokenOptionMixinClass;
        let value: ITokenOption;

        beforeEach(() => {
            tokenOptionMixinClass = TokenOptionMixin(Object);
            value = new tokenOptionMixinClass();
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

        it('should have proeprty `tokenBalanceChange`', () => {
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
    });
});
