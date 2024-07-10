/// <reference types="@angular/localize" />

// https://stackoverflow.com/a/75264128
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requireCredentialHandlerModule = (import.meta as any).webpackContext('./app/credential-handlers/', {
    recursive: true,
    regExp: /\.ts$/
});
requireCredentialHandlerModule.keys().forEach(requireCredentialHandlerModule);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requireTokenOptionModule = (import.meta as any).webpackContext('./app/token-options/', {
    recursive: true,
    regExp: /\/preload-[^/]*\.ts$/
});
requireTokenOptionModule.keys().forEach(requireTokenOptionModule);

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

(async () => {
    const appModule = await import('./app/app.module').then((m) => m.AppModule);

    platformBrowserDynamic()
        .bootstrapModule(appModule)
        .catch((err) => console.error(err));
})();
