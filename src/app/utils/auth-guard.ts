import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, createUrlTreeFromSnapshot } from '@angular/router';
import { CanvasService } from 'app/services/canvas.service';
import { QualtricsService } from 'app/services/qualtrics.service';

export const AUTH_GUARD = (next: ActivatedRouteSnapshot) => {
    const isLoggedIn =
        inject(QualtricsService).hasCredentialConfigured() && inject(CanvasService).hasCredentialConfigured();
    if (!isLoggedIn) {
        // https://blog.herodevs.com/functional-router-guards-in-angular-15-open-the-door-to-happier-code-4a53bb60f78a
        return createUrlTreeFromSnapshot(next, ['/', 'login']);
    }
    return true;
};
