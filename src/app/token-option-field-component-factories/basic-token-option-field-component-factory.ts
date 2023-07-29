import { BasicTokenOption } from 'app/token-options/basic-token-option';
import {
    TokenOptionFieldComponentFactory,
    tokenOptionFieldComponentBuilder
} from './token-option-field-component-factory';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { Injectable, type EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import type { FormField } from 'app/utils/form-field/form-field';
import { StaticFormField } from 'app/utils/form-field/static-form-field';

@Injectable()
export class BasicTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<BasicTokenOption> {
    public create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        FormField<BasicTokenOption | TokenOptionGroup, BasicTokenOption, any>
    ] {
        return tokenOptionFieldComponentBuilder(environmentInjector)
            .appendField(new StaticFormField<BasicTokenOption | TokenOptionGroup>())
            .transformSrc((value: BasicTokenOption | TokenOptionGroup) =>
                value instanceof TokenOptionGroup ? [value, value] : [value, value]
            )
            .transformDest(async ([id, name, description, tokenBalanceChange, value]) => {
                if (value instanceof TokenOptionGroup) {
                    return new BasicTokenOption(value, 'basic', id, name, description, tokenBalanceChange, false);
                } else {
                    value.name = name;
                    value.description = description;
                    value.tokenBalanceChange = tokenBalanceChange;
                    return value;
                }
            })
            .build();
    }

    public get type(): string {
        return 'basic';
    }
}
