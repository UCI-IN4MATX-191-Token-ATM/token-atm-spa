import {
    <%= classify(name) %>TokenOptionDataDef,
    type <%= classify(name) %>TokenOption,
    type <%= classify(name) %>TokenOptionData
} from './<%= dasherize(name) %>-token-option';
import {
    TokenOptionFieldComponentFactory,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from 'app/token-options/token-option-field-component-factory';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { Injectable, type EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import type { FormField } from 'app/utils/form-field/form-field';

@Injectable()
export class <%= classify(name) %>TokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<<%= classify(name) %>TokenOption> {
    public create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        FormField<<%= classify(name) %>TokenOption | TokenOptionGroup, <%= classify(name) %>TokenOptionData, any>
    ] {
        // TODO-Now: add more FormFields
        throw new Error('Custom token option field component factory for <%= classify(name) %>TokenOption is not implemented!');
        return tokenOptionValidationWrapper(
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .transformSrc((value: <%= classify(name) %>TokenOption | TokenOptionGroup) => value)
                .transformDest(async (value) => {
                    return {
                        ...value,
                        type: '<%= dasherize(name) %>'
                    };
                }),
            <%= classify(name) %>TokenOptionDataDef.is
        ).build();
    }

    public get type(): string {
        return '<%= dasherize(name) %>';
    }
}
