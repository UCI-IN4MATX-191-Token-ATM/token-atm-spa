import { normalize } from '@angular-devkit/core';
import { apply, chain, MergeStrategy, mergeWith, move, Rule, url, strings, template } from '@angular-devkit/schematics';

interface GenerateTokenOptionOptions {
    name: string;
    path: string;
    useCustomRequest: boolean;
    useCustomResolver: boolean;
    overwrite: boolean;
}

export function generateTokenOption(options: GenerateTokenOptionOptions): Rule {
    const { name, path, useCustomRequest, useCustomResolver, overwrite } = options;
    return () => {
        const resultRules: Rule[] = [];
        const mergeStrategy = overwrite ? MergeStrategy.Overwrite : MergeStrategy.Error;

        const constructTemplates = (urlStr: string) =>
            apply(url(urlStr), [
                template({
                    ...strings,
                    ...options
                }),
                move(normalize(path) + '/' + strings.dasherize(name))
            ]);
        resultRules.push(mergeWith(constructTemplates('./files/generic'), mergeStrategy));

        if (useCustomRequest) resultRules.push(mergeWith(constructTemplates('./files/custom-request'), mergeStrategy));
        if (useCustomResolver)
            resultRules.push(mergeWith(constructTemplates('./files/custom-resolver'), mergeStrategy));

        return chain(resultRules);
    };
}
