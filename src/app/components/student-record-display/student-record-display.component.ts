import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { Student } from 'app/data/student';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { ModalManagerService } from 'app/services/modal-manager.service';
import { StudentRecordManagerService } from 'app/services/student-record-manager.service';
import { format } from 'date-fns';

@Component({
    selector: 'app-student-record-display',
    templateUrl: './student-record-display.component.html',
    styleUrls: ['./student-record-display.component.sass']
})
export class StudentRecordDisplayComponent {
    configuration?: TokenATMConfiguration;
    student?: Student;
    studentRecord?: StudentRecord;
    tokenAdjustmentCount = 0;
    tokenAdjustmentMessage = '';
    @Output() goBack = new EventEmitter<void>();

    constructor(
        @Inject(StudentRecordManagerService) private recordManagerService: StudentRecordManagerService,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService
    ) {}

    public async configureStudent(configuration: TokenATMConfiguration, student: Student): Promise<void> {
        this.studentRecord = undefined;
        this.tokenAdjustmentCount = 0;
        this.tokenAdjustmentMessage = '';
        this.configuration = configuration;
        this.student = student;
        this.studentRecord = await this.recordManagerService.getStudentRecord(this.configuration, this.student);
    }

    formatDate(date: Date): string {
        return format(date, 'MMM dd, yyyy kk:mm:ss');
    }

    async onAddManualChange(): Promise<void> {
        if (!this.configuration || !this.studentRecord) return;
        if (this.tokenAdjustmentCount == null) return;
        if (this.tokenAdjustmentMessage == null) this.tokenAdjustmentMessage = '';
        const [modalRef, result] = await this.modalManagerService.createConfirmationModal(
            `Do you really want to change student token balance by ${
                this.tokenAdjustmentCount.toString() +
                (this.tokenAdjustmentMessage == ''
                    ? '?'
                    : ` with the following message?\n${this.tokenAdjustmentMessage}`)
            }`
        );
        if (result) {
            if (modalRef.content) modalRef.content.disableButton = true;
            const nowTime = new Date();
            await this.recordManagerService.logProcessedRequest(
                this.configuration,
                this.studentRecord,
                new ProcessedRequest(
                    this.configuration,
                    -1,
                    'Manual Adjustment',
                    this.studentRecord.student,
                    true,
                    nowTime,
                    nowTime,
                    this.tokenAdjustmentCount,
                    this.tokenAdjustmentMessage
                )
            );
            this.tokenAdjustmentCount = 0;
            this.tokenAdjustmentMessage = '';
        }
        modalRef.hide();
    }

    onGoBack(): void {
        this.goBack.next();
    }

    get processedRequests(): ProcessedRequest[] | undefined {
        return this.studentRecord?.processedRequests.slice(0).reverse();
    }
}
