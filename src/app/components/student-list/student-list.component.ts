import { Component, Inject, ViewChild } from '@angular/core';
import type { Course } from 'app/data/course';
import type { Student } from 'app/data/student';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { CanvasService } from 'app/services/canvas.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { PaginatedView } from 'app/utils/paginated-view';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';
import type { StudentRecordDisplayComponent } from '../student-record-display/student-record-display.component';

@Component({
    selector: 'app-student-list',
    templateUrl: './student-list.component.html',
    styleUrls: ['./student-list.component.sass']
})
export class StudentListComponent implements CourseConfigurable {
    //drop down
    public POSSIBLE_PAGE_CNTS = [5, 10, 25, 50];
    public DEFAULT_PAGE_CNT = 50;

    course?: Course;
    configuration?: TokenATMConfiguration;
    students?: PaginatedView<Student>;
    studentGrades?: Map<string, number>;
    isFetchingInfo = false;
    pageCnt: number = this.DEFAULT_PAGE_CNT;
    isShowingIndividualStudent = false;
    @ViewChild('individaulStudentRecordDisplay')
    individaulStudentRecordDisplay?: StudentRecordDisplayComponent;

    constructor(
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(TokenATMConfigurationManagerService)
        private tokenATMConfigurationManagerService: TokenATMConfigurationManagerService
    ) {}

    async configureCourse(course: Course): Promise<void> {
        this.course = course;
        this.configuration = await this.tokenATMConfigurationManagerService.getTokenATMConfiguration(this.course);
        await this.refreshStudentList();
    }

    async changePageSize(size: number): Promise<void> {
        this.pageCnt = size;
        await this.refreshStudentList();
    }

    private async refreshStudentList(): Promise<void> {
        if (!this.course) return;
        this.students = await this.canvasService.getCourseStudents(this.course.id, this.pageCnt);
        await this.getStudentGrades();
    }

    private async getStudentGrades(): Promise<void> {
        if (!this.course || !this.configuration || !this.students) return;
        this.studentGrades = await this.canvasService.getStudentsGrades(
            this.course.id,
            this.configuration.logAssignmentId,
            Array.from(this.students).map((entry: Student) => entry.id)
        );
    }

    async prev(): Promise<void> {
        if (!this.students) return;
        this.isFetchingInfo = true;
        await this.students.prev();
        await this.getStudentGrades();
        this.isFetchingInfo = false;
    }

    async next(): Promise<void> {
        if (!this.students) return;
        this.isFetchingInfo = true;
        await this.students.next();
        await this.getStudentGrades();
        this.isFetchingInfo = false;
    }

    navigateToStudent(student: Student): void {
        if (!this.configuration || !this.individaulStudentRecordDisplay) return;
        this.isShowingIndividualStudent = true;
        this.individaulStudentRecordDisplay.configureStudent(this.configuration, student);
    }

    onGoBack() {
        this.isShowingIndividualStudent = false;
    }
}
