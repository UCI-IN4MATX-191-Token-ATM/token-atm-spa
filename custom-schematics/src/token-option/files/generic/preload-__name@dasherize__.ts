import registerTokenOption from 'app/token-options/token-option-register-helper';
import { <%= classify(name) %>TokenOption } from './<%= dasherize(name) %>-token-option';<% if (useCustomResolver) { %>
import { <%= classify(name) %>TokenOptionResolver } from './<%= dasherize(name) %>-token-option-resolver';<% } %>
import { <%= classify(name) %>TokenOptionFieldComponentFactory } from './<%= dasherize(name) %>-token-option-field-component-factory';<% if (useCustomRequest) { %>
import { <%= classify(name) %>RequestResolver } from './<%= dasherize(name) %>-request-resolver';<% } %>
import { <%= classify(name) %>RequestHandler } from './<%= dasherize(name) %>-request-handler';

registerTokenOption(<%= classify(name) %>TokenOption, {
    // order: 0,
    type: '<%= dasherize(name) %>',
    descriptiveName: '<%= dasherize(name) %>-token-option', //TODO-Now<% if (useCustomRequest) { %>
    requestResolver: <%= classify(name) %>RequestResolver,<% } %>
    requestHandler: <%= classify(name) %>RequestHandler,<% if (useCustomResolver) { %>
    resolver: <%= classify(name) %>TokenOptionResolver,<% } %>
    componentFactory: <%= classify(name) %>TokenOptionFieldComponentFactory
});
