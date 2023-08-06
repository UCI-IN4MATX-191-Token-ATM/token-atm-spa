import {
    BasicTokenOptionDataDef,
    type BasicTokenOption,
    type BasicTokenOptionData
} from 'app/token-options/basic-token-option';
import {
    TokenOptionFieldComponentFactory,
    tokenOptionFieldComponentBuilder,
    tokenOptionValidationWrapper
} from './token-option-field-component-factory';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { Injectable, type EnvironmentInjector, type ViewContainerRef } from '@angular/core';
import type { FormField } from 'app/utils/form-field/form-field';

@Injectable()
export class BasicTokenOptionFieldComponentFactory extends TokenOptionFieldComponentFactory<BasicTokenOption> {
    public create(environmentInjector: EnvironmentInjector): [
        (viewContainerRef: ViewContainerRef) => void,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        FormField<BasicTokenOption | TokenOptionGroup, BasicTokenOptionData, any>
    ] {
        return tokenOptionValidationWrapper(
            environmentInjector,
            tokenOptionFieldComponentBuilder(environmentInjector)
                .transformSrc((value: BasicTokenOption | TokenOptionGroup) => value)
                .transformDest(async (value) => {
                    return {
                        ...value,
                        type: 'basic'
                    };
                }),
            BasicTokenOptionDataDef.is
        ).build();
    }

    public get type(): string {
        return 'basic';
    }
}
