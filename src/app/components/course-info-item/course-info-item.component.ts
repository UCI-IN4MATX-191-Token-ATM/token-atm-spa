import { Component, Inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import type { Course } from 'app/data/course';

@Component({
    selector: 'app-course-info-item',
    templateUrl: './course-info-item.component.html',
    styleUrls: ['./course-info-item.component.sass']
})
export class CourseInfoItemComponent {
    @Input() course: Course | undefined;

    constructor(@Inject(Router) private router: Router) {}

    onSelectCourse() {
        if (!this.course) return;
        this.router.navigateByUrl('/dashboard', { state: this.course });
    }
}
