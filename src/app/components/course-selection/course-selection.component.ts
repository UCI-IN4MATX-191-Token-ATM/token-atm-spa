import { Component, Inject, type OnInit } from '@angular/core';
import { Router } from '@angular/router';
import type { Course } from 'app/data/course';
import { FormItemInfo } from 'app/data/form-item-info';
import { CanvasService } from 'app/services/canvas.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';
import { BsModalService } from 'ngx-bootstrap/modal';
import { CreateConfigurationModalComponent } from '../create-configuration-modal/create-configuration-modal.component';

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

    constructor(
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(Router) private router: Router,
        @Inject(TokenATMConfigurationManagerService)
        private configurationManagerService: TokenATMConfigurationManagerService,
        @Inject(BsModalService) private modalService: BsModalService
    ) {}

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

    async onSelectCourse(course: Course): Promise<void> {
        this.loading = true;
        try {
            await this.configurationManagerService.getTokenATMConfiguration(course);
            this.router.navigateByUrl('/dashboard', { state: course });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            let promiseResolve;
            const promise = new Promise<boolean>((resolve) => {
                promiseResolve = resolve;
            });
            const modalRef = this.modalService.show(CreateConfigurationModalComponent, {
                initialState: {
                    onResolve: promiseResolve,
                    course: course
                },
                class: 'modal-lg',
                backdrop: 'static',
                keyboard: false
            });
            const result = await promise;
            if (!result) {
                this.loading = false;
                modalRef.hide();
            } else {
                modalRef.hide();
                this.router.navigateByUrl('/dashboard', { state: course });
            }
        }
    }
}
