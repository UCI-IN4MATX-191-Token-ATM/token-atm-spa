import { Component, Inject, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import type { Course } from 'app/data/course';
import type { Subscription } from 'rxjs';
import { CourseConfigurable, TokenATMDashboardRoute, TOKEN_ATM_DASHBOARD_ROUTES } from './dashboard-routing';
import { CanvasService } from 'app/services/canvas.service';
// import { User } from 'app/data/user';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.sass']
})
export class DashboardComponent implements OnDestroy {
    private courseSubscription: Subscription | undefined;
    course: Course | undefined;
    // user: User | undefined;
    avatarUrl?: string;
    name: string | undefined;
    email: string | undefined;

    constructor(@Inject(Router) private router: Router, @Inject(CanvasService) private canvasService: CanvasService) {
        this.courseSubscription = this.router.events.subscribe((event) => {
            if (!(event instanceof NavigationEnd)) return;
            if (!(event.url == '/dashboard')) return;
            const course = this.router.getCurrentNavigation()?.extras.state;
            if (!course) return;
            this.configureCourse(course as Course);
            // const user = this.router.getCurrentNavigation()?.extras.state;
            // if (!course) return;
            this.configureUserInformation('self');
        });
    }

    private async configureUserInformation(userId: string) {
        // Retrieve user information from the API
        const getuser = await this.canvasService.getUserInformation(userId);
        this.name = getuser.name;
        this.email = getuser.email;
        this.avatarUrl = getuser.avatar_url;
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
