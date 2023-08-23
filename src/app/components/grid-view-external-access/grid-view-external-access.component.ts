import { Component, Inject, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import type { GridViewData } from 'app/token-options/mixins/grid-view-data-source-mixin';
import type { Subscription } from 'rxjs';

@Component({
    selector: 'app-grid-view-external-access',
    templateUrl: './grid-view-external-access.component.html',
    styleUrls: ['./grid-view-external-access.component.sass']
})
export class GridViewExternalAccessComponent implements OnDestroy {
    private isListenerActive = false;
    data?: [GridViewData[], string[]];
    subscription?: Subscription;

    messageListener = (
        event: MessageEvent<{
            type: 'GRID_VIEW_DATA';
            value: [GridViewData[], string[]];
        }>
    ) => {
        if (event.origin != window.location.origin) return;
        if (event.data.type != 'GRID_VIEW_DATA') return;
        this.data = event.data.value;
        window.removeEventListener('message', this.messageListener);
        this.isListenerActive = false;
    };

    constructor(@Inject(Router) private router: Router) {
        this.subscription = this.router.events.subscribe((event) => {
            if (!(event instanceof NavigationEnd)) return;
            if (!(event.url == '/grid-view')) return;
            if (this.isListenerActive) return;
            window.addEventListener('message', this.messageListener);
            this.isListenerActive = true;
        });
    }

    ngOnDestroy(): void {
        if (!this.isListenerActive) window.removeEventListener('message', this.messageListener);
        if (this.subscription) this.subscription.unsubscribe();
    }
}
