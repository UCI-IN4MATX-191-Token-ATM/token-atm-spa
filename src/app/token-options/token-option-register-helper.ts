import type { Type } from '@angular/core';
import { RequestHandlerRegistry } from 'app/token-options/request-handler-registry';
import type { RequestHandler } from 'app/token-options/request-handlers';
import type { RequestResolver } from 'app/token-options/request-resolver';
import { RequestResolverRegistry } from 'app/token-options/request-resolver-registry';
import type { TokenATMRequest } from 'app/token-options/token-atm-request';
import type { TokenOptionFieldComponentFactory } from 'app/token-options/token-option-field-component-factory';
import { TokenOptionFieldComponentFactoryRegistry } from 'app/token-options/token-option-field-component-factory-registry';
import type { TokenOptionResolver } from 'app/token-options/token-option-resolver';
import { TokenOptionResolverRegistry } from 'app/token-options/token-option-resolver-registry';
import type { TokenOption } from './token-option';
import { TokenOptionRegistry } from './token-option-registry';

interface CustomRequestTokenOptionOptions<
    T extends TokenOption = TokenOption,
    R extends TokenATMRequest<T> = TokenATMRequest<T>
> {
    requestResolver: Type<RequestResolver<T, R>>;
    requestHandler: Type<RequestHandler<T, R>>;
}

interface DefaultRequestTokenOptionOptions<T extends TokenOption = TokenOption> {
    requestHandler: Type<RequestHandler<T, TokenATMRequest<T>>>;
}

interface RegisterTokenOptionOptions<T extends TokenOption> {
    order?: number;
    type: string;
    descriptiveName: string;
    resolver?: Type<TokenOptionResolver<T>>;
    componentFactory: Type<TokenOptionFieldComponentFactory<T>>;
}

const REGISTERED_TOKEN_OPTIONS = new Set<Type<TokenOption>>();

export default function registerTokenOption<T extends TokenOption, R extends TokenATMRequest<T> = TokenATMRequest<T>>(
    tokenOptionClass: Type<T>,
    options: RegisterTokenOptionOptions<T> &
        (CustomRequestTokenOptionOptions<T, R> | DefaultRequestTokenOptionOptions<T>)
): void {
    if (REGISTERED_TOKEN_OPTIONS.has(tokenOptionClass)) return;
    REGISTERED_TOKEN_OPTIONS.add(tokenOptionClass);
    const { order, type, descriptiveName, resolver, componentFactory } = options;

    TokenOptionRegistry.registerTokenOption(tokenOptionClass, type, descriptiveName, order);

    if (resolver) TokenOptionResolverRegistry.registerTokenOptionResolver(resolver);
    else TokenOptionResolverRegistry.registerDefaultTokenOptionResolver(tokenOptionClass, type);

    TokenOptionFieldComponentFactoryRegistry.registerFieldComponentFactory(componentFactory);

    if ('requestResolver' in options) {
        RequestResolverRegistry.registerRequestResolver(options.requestResolver);
        RequestHandlerRegistry.registerRequestHandler(options.requestHandler);
    } else {
        RequestResolverRegistry.registerDefaultRequestResolver(type);
        RequestHandlerRegistry.registerRequestHandler(options.requestHandler);
    }
}
