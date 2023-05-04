import { Component } from '@angular/core';
import type { Course } from 'app/data/course';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';

@Component({
    selector: 'app-student-list',
    templateUrl: './student-list.component.html',
    styleUrls: ['./student-list.component.sass']
})
export class StudentListComponent implements CourseConfigurable {
    course?: Course;

    async configureCourse(course: Course): Promise<void> {
        // TODO: configure course for student list
        this.course = course;
    }
}
