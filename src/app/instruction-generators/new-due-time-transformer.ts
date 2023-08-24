import type { TokenOption } from 'app/token-options/token-option';
import { format } from 'date-fns';
import { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';
import { MultipleSectionDateMatcher } from 'app/utils/multiple-section-date-matcher';

type HasNewDueTime = {
    newDueTime: Date | MultipleSectionDateMatcher;
};

export class NewDueTimeTransformer extends TokenOptionInstructionTransformer<HasNewDueTime> {
    public get infoDescription(): string {
        return 'Extends Assignment/Quiz Until Date To';
    }

    public process(tokenOptions: TokenOption[]): string[] {
        return tokenOptions.map((tokenOption) => {
            const convertedObject = this.validate(tokenOption);
            if (convertedObject == undefined) return '';
            const newDueTime = convertedObject.newDueTime;
            if (newDueTime instanceof Date) {
                return format(newDueTime, 'MMM dd, yyyy kk:mm:ss');
            } else {
                return [
                    '<table style="border-collapse: collapse; width: 100%;">',
                    '<tbody>',
                    ...newDueTime.overrides.map((override) => {
                        return [
                            `<tr>`,
                            `<td style="text-align: end; text-wrap: nowrap">${override.name}:</td>`,
                            `<td style="text-align: start; text-wrap: nowrap">${format(
                                override.date,
                                'MMM dd, yyyy kk:mm:ss'
                            )}</td>`,
                            `</tr>`
                        ].join('');
                    }),
                    '<tr>',
                    '<td style="text-align: end; text-wrap: nowrap">Default:</td>',
                    `<td style="text-align: start; text-wrap: nowrap">${format(
                        newDueTime.defaultDate,
                        'MMM dd, yyyy kk:mm:ss'
                    )}</td>`,
                    '</tr>',
                    '</tbody>',
                    '</table>'
                ].join('');
            }
        });
    }

    public validate(tokenOption: TokenOption): HasNewDueTime | undefined {
        const value = (tokenOption as unknown as HasNewDueTime).newDueTime;
        return value != undefined && (value instanceof Date || value instanceof MultipleSectionDateMatcher)
            ? (tokenOption as unknown as HasNewDueTime)
            : undefined;
    }
}
