import { Component } from '@angular/core';
import type { Course } from 'app/data/course';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';

@Component({
    selector: 'app-token-option-configuration',
    templateUrl: './token-option-configuration.component.html',
    styleUrls: ['./token-option-configuration.component.sass']
})
export class TokenOptionConfigurationComponent implements CourseConfigurable {
    course?: Course;

    async configureCourse(course: Course): Promise<void> {
        // TODO: configure course for token option configuration
        this.course = course;
    }
}
