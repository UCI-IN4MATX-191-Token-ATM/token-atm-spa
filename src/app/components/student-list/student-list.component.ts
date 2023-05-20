import { Component } from '@angular/core';
import type { Course } from 'app/data/course';
import type { CanvasService } from 'app/services/canvas.service';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';

export class StudentListComponent implements CourseConfigurable {
    // TODO: configure course for student list
    course?: Course;
    studentNames: string[] = [];

    constructor(private canvasService: CanvasService) {}

    async configureCourse(course: Course): Promise<void> {
        this.course = course;
        const courseId = course.id;

        try {
            const paginatedViews = await this.canvasService.getCourseStudents(courseId);
            const pageCount = 3; // Number of pages to fetch

            for await (const student of paginatedViews.take(pageCount)) {
                this.studentNames.push(student.name);
            }
        } catch (error) {
            console.error('Error fetching student names:', error);
        }
    }
}

//TODO Dropdown menu for page size
//two buttons to change page
//

//     constructor(@Inject(CanvasService) private canvasService: CanvasService) {}

//     ngOnInit() {
//         this.loading = true;
//         this.fetchCourses().then(() => {
//             this.loading = false;
//         });
//     }

//     private async fetchCourses() {
//         this.coursesEnrolledAsTeacher = await DataConversionHelper.convertAsyncIterableToList(
//             await this.canvasService.getCourses('student', 'active')
//         );
