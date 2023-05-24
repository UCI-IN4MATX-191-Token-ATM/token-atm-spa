import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { Student } from 'app/data/student';
import type { StudentRecord } from 'app/data/student-record';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { ModalConfirmationService } from 'app/services/modal-confirmation.service';
import { StudentRecordManagerService } from 'app/services/student-record-manager.service';
import { format, getUnixTime } from 'date-fns';

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
        @Inject(ModalConfirmationService) private modalConfirmationService: ModalConfirmationService
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
        const [modalRef, result] = await this.modalConfirmationService.createConfirmationModal(
            `Do you really want to change student token balance by ${
                this.tokenAdjustmentCount.toString() +
                (this.tokenAdjustmentMessage == ''
                    ? '?'
                    : ` with the following message?\n${this.tokenAdjustmentMessage}`)
            }`
        );
        if (result) {
            if (modalRef.content) modalRef.content.disableButton = true;
            const nowTime = getUnixTime(new Date());
            await this.recordManagerService.logProcessedRequest(
                this.configuration,
                this.studentRecord,
                new ProcessedRequest(this.configuration, this.studentRecord.student, {
                    token_option_id: -1,
                    token_option_name: 'Manual Adjustment',
                    is_approved: true,
                    message: this.tokenAdjustmentMessage,
                    submit_time: nowTime,
                    process_time: nowTime,
                    token_balance_change: this.tokenAdjustmentCount
                })
            );
            this.tokenAdjustmentCount = 0;
            this.tokenAdjustmentMessage = '';
        }
        modalRef.hide();
    }

    onGoBack(): void {
        this.goBack.next();
    }
}
