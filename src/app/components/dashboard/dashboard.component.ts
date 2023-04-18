import { Component, Inject, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import type { Course } from 'app/data/course';
import type { Subscription } from 'rxjs';
import { CourseConfigurable, TokenATMDashboardRoute, TOKEN_ATM_DASHBOARD_ROUTES } from './dashboard-routing';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.sass']
})
export class DashboardComponent implements OnDestroy {
    private courseSubscription: Subscription | undefined;
    course: Course | undefined;

    constructor(@Inject(Router) private router: Router) {
        this.courseSubscription = this.router.events.subscribe((event) => {
            if (!(event instanceof NavigationEnd)) return;
            if (!(event.url == '/dashboard')) return;
            const course = this.router.getCurrentNavigation()?.extras.state;
            if (!course) return;
            this.configureCourse(course as Course);
        });
    }

    private configureCourse(course: Course) {
        this.course = course;
        // TODO: retrieve other information and display
    }

    ngOnDestroy(): void {
        if (!this.courseSubscription) return;
        this.courseSubscription.unsubscribe();
    }

    get routes(): TokenATMDashboardRoute[] {
        return TOKEN_ATM_DASHBOARD_ROUTES;
    }

    async onComponentActivate(component: CourseConfigurable) {
        if (!this.course) return;
        await component.configureCourse(this.course);
    }
}
