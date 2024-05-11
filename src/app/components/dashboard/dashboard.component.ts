import { Component, Inject, isDevMode, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import type { Course } from 'app/data/course';
import type { Subscription } from 'rxjs';
import { CourseConfigurable, TokenATMDashboardRoute, TOKEN_ATM_DASHBOARD_ROUTES } from './dashboard-routing';
import { CanvasService } from 'app/services/canvas.service';
import { ModalManagerService } from 'app/services/modal-manager.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.sass']
})
export class DashboardComponent implements OnDestroy {
    private courseSubscription: Subscription | undefined;
    course: Course | undefined;
    avatarUrl?: string;
    name: string | undefined;
    email: string | undefined;
    localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    constructor(
        @Inject(Router) private router: Router,
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService
    ) {
        this.courseSubscription = this.router.events.subscribe((event) => {
            if (!(event instanceof NavigationEnd)) return;
            if (!(event.url == '/dashboard')) return;
            const course = this.router.getCurrentNavigation()?.extras.state;
            if (!course) return;
            this.configureCourse(course as Course);
            this.configureUserInformation('self');
        });
    }

    private async configureUserInformation(userId: string) {
        // Retrieve user information from the API
        const getuser = await this.canvasService.getUserInformation(userId);
        this.name = getuser.name;
        this.email = getuser.email;
        this.avatarUrl = getuser.avatarURL;
    }

    private configureCourse(course: Course) {
        this.course = course;
    }

    ngOnDestroy(): void {
        if (!this.courseSubscription) return;
        this.courseSubscription.unsubscribe();
    }

    get routes(): TokenATMDashboardRoute[] {
        return TOKEN_ATM_DASHBOARD_ROUTES.filter((route) => isDevMode() || !route.isDev);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async onComponentActivate(component: any) {
        if (!this.course) return;
        if ('configureCourse' in component && typeof component['configureCourse'] == 'function')
            await (component as CourseConfigurable).configureCourse(this.course);
    }

    async onWarningClick() {
        if (!this.course || this.localTimeZone === this.course.timeZone) return;
        await this.modalManagerService.createNotificationModal(
            `This course is configured with the time zone, ${this.course.timeZone}, while Token ATM is running on a computer using the ${this.localTimeZone} time zone. \n\n When working with dates and times make sure the what you provide is also appropriate for your Course.`,
            'Time Zone Warning'
        );
    }
}
