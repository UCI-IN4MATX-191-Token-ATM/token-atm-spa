import { Component } from '@angular/core';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';
import type { Course } from 'app/data/course';

@Component({
    selector: 'app-token-count-adjustment',
    templateUrl: './token-count-adjustment.component.html',
    styleUrls: ['./token-count-adjustment.component.sass']
})
export class TokenCountAdjustmentComponent implements CourseConfigurable {
    course?: Course;

    async configureCourse(course: Course): Promise<void> {
        // TODO: configure course for token count adjustment
        this.course = course;
    }
}
