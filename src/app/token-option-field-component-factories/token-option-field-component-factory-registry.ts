import {
    EnvironmentInjector,
    Inject,
    Injectable,
    InjectionToken,
    Optional,
    ViewContainerRef,
    type Type
} from '@angular/core';
import type { TokenOptionFieldComponentFactory } from './token-option-field-component-factory';
import type { TokenOption } from 'app/token-options/token-option';
import type { FormField } from 'app/utils/form-field/form-field';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { BasicTokenOptionFieldComponentFactory } from './basic-token-option-field-component-factory';
import { EarnByModuleTokenOptionFieldComponentFactory } from './earn-by-module-token-option-field-component-factory';
import { EarnByQuizTokenOptionFieldComponentFactory } from './earn-by-quiz-token-option-field-component-factory';
import { EarnBySurveyTokenOptionFieldComponentFactory } from './earn-by-survey-token-option-field-component-factory';
import { SpendForAssignmentResubmissionTokenOptionFieldComponentFactory } from './spend-for-assignment-resubmission-token-option-field-component-factory';
import { SpendForLabDataTokenOptionFieldComponentFactory } from './spend-for-lab-data-token-option-field-component-factory';
import { SpendForLabSwitchTokenOptionFieldComponentFactory } from './spend-for-lab-switch-token-option-field-component-factory';
import { WithdrawAssignmentResubmissionTokenOptionFieldComponentFactory } from './withdraw-assignment-resubmission-token-option-field-component-factory';
import { WithdrawLabDataTokenOptionFieldComponentFactory } from './withdraw-lab-data-token-option-field-component-factory';
import { WithdrawLabSwitchTokenOptionFieldComponentFactory } from './withdraw-lab-switch-token-option-field-component-factory';
import { SpendForAssignmentExtensionTokenOptionFieldComponentFactory } from './spend-for-assignment-extension-token-option-field-component-factory';

export const REGISTERED_TOKEN_OPTION_FIELD_COMPONENT_FACTORIES: Type<TokenOptionFieldComponentFactory<TokenOption>>[] =
    [
        BasicTokenOptionFieldComponentFactory,
        EarnByModuleTokenOptionFieldComponentFactory,
        EarnByQuizTokenOptionFieldComponentFactory,
        EarnBySurveyTokenOptionFieldComponentFactory,
        SpendForAssignmentResubmissionTokenOptionFieldComponentFactory,
        SpendForLabDataTokenOptionFieldComponentFactory,
        SpendForLabSwitchTokenOptionFieldComponentFactory,
        WithdrawAssignmentResubmissionTokenOptionFieldComponentFactory,
        WithdrawLabDataTokenOptionFieldComponentFactory,
        WithdrawLabSwitchTokenOptionFieldComponentFactory,
        SpendForAssignmentExtensionTokenOptionFieldComponentFactory
    ];

export const TOKEN_OPTION_FIELD_COMPONENT_FACTORY_INJECTION_TOKEN = new InjectionToken<
    TokenOptionFieldComponentFactory<TokenOption>[]
>('TOKEN_OPTION_FIELD_COMPONENT_FACTORY');

@Injectable({
    providedIn: 'root'
})
export class TokenOptionFieldComponentFactoryRegistry {
    private _tokenOptionFieldComponentFactorysMap = new Map<string, TokenOptionFieldComponentFactory<TokenOption>>();

    constructor(
        @Optional()
        @Inject(TOKEN_OPTION_FIELD_COMPONENT_FACTORY_INJECTION_TOKEN)
        tokenOptionFieldComponentFactorys?: TokenOptionFieldComponentFactory<TokenOption>[]
    ) {
        if (tokenOptionFieldComponentFactorys)
            tokenOptionFieldComponentFactorys.forEach((factory) => {
                this._tokenOptionFieldComponentFactorysMap.set(factory.type, factory);
            });
    }

    private getTokenOptionFieldComponentFactory(
        type: string
    ): TokenOptionFieldComponentFactory<TokenOption> | undefined {
        return this._tokenOptionFieldComponentFactorysMap.get(type);
    }

    public createTokenOptionFieldComponent(
        type: string,
        environmentInjector: EnvironmentInjector
    ): // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | [(viewContainerRef: ViewContainerRef) => void, FormField<TokenOption | TokenOptionGroup, unknown, any>]
        | undefined {
        const factory = this.getTokenOptionFieldComponentFactory(type);
        if (!factory) return undefined;
        return factory.create(environmentInjector);
    }
}
