import { Component, Inject, Input } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { CanvasService } from 'app/services/canvas.service';
import { StudentRecordManagerService } from 'app/services/student-record-manager.service';
import type { BsModalRef } from 'ngx-bootstrap/modal';
import * as CSVParse from 'papaparse';

@Component({
    selector: 'app-batch-token-balance-adjustment-modal',
    templateUrl: './batch-token-balance-adjustment-modal.component.html',
    styleUrls: ['./batch-token-balance-adjustment-modal.component.sass']
})
export class BatchTokenBalanceAdjustmentModalComponent {
    isProcessing = false;
    @Input() configuration?: TokenATMConfiguration;
    modalRef?: BsModalRef<unknown>;

    selectedFile?: File;
    progress?: string;
    progressMessage?: string;

    constructor(
        @Inject(StudentRecordManagerService) private managerService: StudentRecordManagerService,
        @Inject(CanvasService) private canvasService: CanvasService
    ) {}

    onSelectFile(event: Event) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.selectedFile = (event.target as any)?.files[0];
    }

    async onImportCSV() {
        if (!this.selectedFile || !this.configuration) return;
        this.isProcessing = true;
        let promiseResolve: (result: string[][]) => void;
        const promise = new Promise<string[][]>((resolve) => {
            promiseResolve = resolve;
        });
        CSVParse.parse<string[]>(this.selectedFile, {
            complete: (results) => {
                promiseResolve(results.data);
            }
        });
        const result = await promise;
        let cnt = 0;
        for (const data of result) {
            cnt++;
            this.progress = (((cnt - 1) / result.length) * 100).toFixed(2);
            this.progressMessage = `${cnt - 1} out of ${result.length} record(s) processed`;
            if (!Array.isArray(data) || (data.length != 2 && data.length != 3)) continue;
            const email = data[0];
            if (typeof email != 'string') continue;
            const tokenBalanceChange = parseFloat(data[1] as string);
            if (isNaN(tokenBalanceChange)) continue;
            const message = data[2];
            const student = await this.canvasService.getStudentByEmail(this.configuration.course.id, email);
            if (!student) continue;
            const studentRecord = await this.managerService.getStudentRecord(this.configuration, student);
            const nowTime = new Date();
            await this.managerService.logProcessedRequest(
                this.configuration,
                studentRecord,
                new ProcessedRequest(
                    this.configuration,
                    -1,
                    'Manual Adjustment',
                    studentRecord.student,
                    true,
                    nowTime,
                    nowTime,
                    tokenBalanceChange,
                    message ?? ''
                )
            );
        }
        this.modalRef?.hide();
    }
}
