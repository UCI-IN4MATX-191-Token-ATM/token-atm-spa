import { Component, Inject, OnInit } from '@angular/core';
import type { Course } from 'app/data/course';
import { CanvasService } from 'app/services/canvas.service';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';

@Component({
    selector: 'app-course-selection',
    templateUrl: './course-selection.component.html',
    styleUrls: ['./course-selection.component.sass']
})
export class CourseSelectionComponent implements OnInit {
    loading = true;
    coursesEnrolledAsTeacher: Course[] = [];
    coursesEnrolledAsTA: Course[] = [];

    constructor(@Inject(CanvasService) private canvasService: CanvasService) {}

    ngOnInit() {
        this.loading = true;
        this.fetchCourses().then(() => {
            this.loading = false;
        });
    }

    private async fetchCourses() {
        this.coursesEnrolledAsTeacher = await DataConversionHelper.convertAsyncIterableToList(
            await this.canvasService.getCourses('teacher', 'active')
        );
        this.coursesEnrolledAsTA = await DataConversionHelper.convertAsyncIterableToList(
            await this.canvasService.getCourses('ta', 'active')
        );
    }
}
