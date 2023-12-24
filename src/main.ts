/// <reference types="@angular/localize" />

// https://stackoverflow.com/a/75264128
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requireModule = (import.meta as any).webpackContext('./app/credential-handlers', {
    regExp: /\.ts$/
});
requireModule.keys().forEach(requireModule);

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

(async () => {
    const appModule = await import('./app/app.module').then((m) => m.AppModule);

    platformBrowserDynamic()
        .bootstrapModule(appModule)
        .catch((err) => console.error(err));
})();
