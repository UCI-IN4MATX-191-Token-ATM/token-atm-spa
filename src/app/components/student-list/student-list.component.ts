import { Component, Inject, ViewChild } from '@angular/core';
import type { Course } from 'app/data/course';
import { FormItemInfo } from 'app/data/form-item-info';
import type { Student } from 'app/data/student';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { CanvasService } from 'app/services/canvas.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { PaginatedView } from 'app/utils/paginated-view';
import { BsModalService } from 'ngx-bootstrap/modal';
import { firstValueFrom } from 'rxjs';
import { BatchTokenBalanceAdjustmentModalComponent } from '../batch-token-balance-adjustment-modal/batch-token-balance-adjustment-modal.component';
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

    studentItemInfo = new FormItemInfo('studentSearchTerm', 'Search for Students', 'text');
    studentSearchTerm = '';

    constructor(
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(TokenATMConfigurationManagerService)
        private tokenATMConfigurationManagerService: TokenATMConfigurationManagerService,
        @Inject(BsModalService) private modalService: BsModalService
    ) {}

    async batchImport(): Promise<void> {
        if (!this.configuration) return;
        const modalRef = this.modalService.show(BatchTokenBalanceAdjustmentModalComponent, {
            initialState: {
                configuration: this.configuration
            },
            backdrop: 'static',
            keyboard: false
        });
        if (modalRef.content) modalRef.content.modalRef = modalRef;
        if (modalRef.onHide) {
            await firstValueFrom(modalRef.onHide);
            await this.refreshStudentList(this.studentSearchTerm);
        }
    }

    async configureCourse(course: Course): Promise<void> {
        this.course = course;
        this.configuration = await this.tokenATMConfigurationManagerService.getTokenATMConfiguration(this.course);
        await this.refreshStudentList(this.studentSearchTerm);
    }

    async search(): Promise<void> {
        await this.refreshStudentList(this.studentSearchTerm);
    }

    async clearSearch(): Promise<void> {
        this.studentSearchTerm = '';
        await this.refreshStudentList(this.studentSearchTerm);
    }

    async changePageSize(size: number): Promise<void> {
        this.pageCnt = size;
        await this.refreshStudentList(this.studentSearchTerm);
    }

    private async refreshStudentList(searchTerm?: string): Promise<void> {
        if (!this.course) return;
        this.students = await this.canvasService.getCourseStudents(this.course.id, this.pageCnt, searchTerm);
        await this.getStudentGrades();
    }

    private async getStudentGrades(): Promise<void> {
        if (!this.course || !this.configuration || !this.students) return;
        this.studentGrades = undefined;
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
