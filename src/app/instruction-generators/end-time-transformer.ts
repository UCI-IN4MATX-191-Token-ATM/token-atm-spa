import type { TokenOption } from 'app/token-options/token-option';
import { format } from 'date-fns';
import { TokenOptionInstructionTransformer } from './token-option-instruction-transformer';
import { MultipleSectionDateMatcher } from 'app/utils/multiple-section-date-matcher';

type HasEndTime = {
    endTime: Date | MultipleSectionDateMatcher;
};

export class EndTimeTransformer extends TokenOptionInstructionTransformer<HasEndTime> {
    public get infoDescription(): string {
        return 'Can Request Until';
    }

    public process(tokenOptions: TokenOption[]): string[] {
        return tokenOptions.map((tokenOption) => {
            const convertedObject = this.validate(tokenOption);
            if (convertedObject == undefined) return '';
            const endTime = convertedObject.endTime;
            if (endTime instanceof Date) {
                return format(endTime, 'MMM dd, yyyy kk:mm:ss');
            } else {
                return [
                    '<table style="border-collapse: collapse; width: 100%;">',
                    '<tbody>',
                    ...endTime.overrides.map((override) => {
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
                        endTime.defaultDate,
                        'MMM dd, yyyy kk:mm:ss'
                    )}</td>`,
                    '</tr>',
                    '</tbody>',
                    '</table>'
                ].join('');
            }
        });
    }

    public validate(tokenOption: TokenOption): HasEndTime | undefined {
        const value = (tokenOption as unknown as HasEndTime).endTime;
        return value != undefined && (value instanceof Date || value instanceof MultipleSectionDateMatcher)
            ? (tokenOption as unknown as HasEndTime)
            : undefined;
    }
}
