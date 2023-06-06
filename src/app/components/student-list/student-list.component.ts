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
    // Possible values for the number of students displayed per page in the student list
    public POSSIBLE_PAGE_CNTS = [5, 10, 25, 50];
    //defult number of students displayed is 50
    public DEFAULT_PAGE_CNT = 50;
    //current select course and can be none
    course?: Course;
    // Configuration related to token ATM
    configuration?: TokenATMConfiguration;
    //Student data in the formate of paginatedView which store student data is previous current and next page format
    students?: PaginatedView<Student>;
    // Link student names with their grades
    studentGrades?: Map<string, number>;
    //defualt fetching state is fase
    isFetchingInfo = false;
    //PageCnt store the number of displayed students selected
    pageCnt: number = this.DEFAULT_PAGE_CNT;
    //Flag indicating whether an individual student's record is being shown
    isShowingIndividualStudent = false;
    @ViewChild('individaulStudentRecordDisplay')
    // Reference to the individual student record display component
    individaulStudentRecordDisplay?: StudentRecordDisplayComponent;

    constructor(
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(TokenATMConfigurationManagerService)
        private tokenATMConfigurationManagerService: TokenATMConfigurationManagerService
    ) {}
    //Configure the course information
    async configureCourse(course: Course): Promise<void> {
        this.course = course;
        this.configuration = await this.tokenATMConfigurationManagerService.getTokenATMConfiguration(this.course);
        await this.refreshStudentList();
    }
    //change the number of student displayed when function is called
    async changePageSize(size: number): Promise<void> {
        this.pageCnt = size;
        await this.refreshStudentList();
    }
    //refrsh the student list according to the number of disaplyed students change
    private async refreshStudentList(): Promise<void> {
        if (!this.course) return;
        this.students = await this.canvasService.getCourseStudents(this.course.id, this.pageCnt);
        await this.getStudentGrades();
    }
    //get students token balance
    private async getStudentGrades(): Promise<void> {
        if (!this.course || !this.configuration || !this.students) return;
        this.studentGrades = undefined;
        this.studentGrades = await this.canvasService.getStudentsGrades(
            this.course.id,
            this.configuration.logAssignmentId,
            Array.from(this.students).map((entry: Student) => entry.id)
        );
    }
    //Go back to the previous students information page
    async prev(): Promise<void> {
        if (!this.students) return;
        this.isFetchingInfo = true;
        await this.students.prev();
        await this.getStudentGrades();
        this.isFetchingInfo = false;
    }
    //Go to the next student's infomration page
    async next(): Promise<void> {
        if (!this.students) return;
        this.isFetchingInfo = true;
        await this.students.next();
        await this.getStudentGrades();
        this.isFetchingInfo = false;
    }
    //get the student's information
    navigateToStudent(student: Student): void {
        if (!this.configuration || !this.individaulStudentRecordDisplay) return;
        this.isShowingIndividualStudent = true;
        this.individaulStudentRecordDisplay.configureStudent(this.configuration, student);
    }

    onGoBack() {
        this.isShowingIndividualStudent = false;
    }
}
