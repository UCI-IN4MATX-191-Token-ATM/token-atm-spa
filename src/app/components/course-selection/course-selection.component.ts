import { Component, Inject, OnInit } from '@angular/core';
import type { Course } from 'app/data/course';
import { FormItemInfo } from 'app/data/form-item-info';
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

    courseItemInfo = new FormItemInfo('courseName', 'Search for Course', 'text');
    courseName = '';

    termItemInfo = new FormItemInfo('termName', 'Search for Term', 'text');
    termName = '';

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

    onCourseNameChange(data: string | null): void {
        this.courseName = data ?? '';
    }

    onTermNameChange(data: string | null): void {
        this.termName = data ?? '';
    }

    get coursesAsTeacher(): Course[] {
        return this.coursesEnrolledAsTeacher.filter(
            (course) =>
                course.name.toLowerCase().indexOf(this.courseName.toLowerCase()) != -1 &&
                course.term.toLowerCase().indexOf(this.termName.toLowerCase()) != -1
        );
    }

    get coursesAsTA(): Course[] {
        return this.coursesEnrolledAsTA.filter(
            (course) =>
                course.name.toLowerCase().indexOf(this.courseName.toLowerCase()) != -1 &&
                course.term.toLowerCase().indexOf(this.termName.toLowerCase()) != -1
        );
    }
}
