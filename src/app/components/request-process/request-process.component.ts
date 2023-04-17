import { Component } from '@angular/core';
import type { Course } from 'app/data/course';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';

@Component({
    selector: 'app-request-process',
    templateUrl: './request-process.component.html',
    styleUrls: ['./request-process.component.sass']
})
export class RequestProcessComponent implements CourseConfigurable {
    course?: Course;

    async configureCourse(course: Course): Promise<void> {
        // TODO: configure course for request processing
        this.course = course;
    }
}
