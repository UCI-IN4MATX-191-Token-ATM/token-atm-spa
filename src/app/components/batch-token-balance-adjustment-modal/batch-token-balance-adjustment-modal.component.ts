import { Component, Inject, Input } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { CanvasService } from 'app/services/canvas.service';
import { StudentRecordManagerService } from 'app/services/student-record-manager.service';
import { countAndNoun } from 'app/utils/pluralize';
import type { BsModalRef } from 'ngx-bootstrap/modal';
import * as CSVParse from 'papaparse';
import { AbstractControl, Validators } from '@angular/forms';

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

    errorCollection?: string[][];

    constructor(
        @Inject(StudentRecordManagerService) private managerService: StudentRecordManagerService,
        @Inject(CanvasService) private canvasService: CanvasService
    ) {}

    onSelectFile(event: Event) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.selectedFile = (event.target as any)?.files[0];
    }

    // TODO: - Selectable Columns
    //       - Header Parsing
    //       - Parsing from & Unparsing to Excel formatted CSVs (https://www.papaparse.com/faq#encoding)
    //       - Downloadable CSV blob for rows with Token ATM Errors
    //          - Use file `.name` and append error label + time
    //          - Use file `.path` for suggested download directory
    //       - Expose Parser Errors & Meta info (`results.errors` & `results.meta`)
    //          - Allow dry-run functionality to test CSV without updating Token ATM
    //       - Make/Use a type for parsed row data (string[] or JSON[])
    //       - Update parser to use a stream to parse row by row
    //       - Only preserve columns needed by Token ATM in Error CSV

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
        this.errorCollection = new Array<string[]>();
        for (const data of result) {
            cnt++;
            this.progress = (((cnt - 1) / result.length) * 100).toFixed(2);
            this.progressMessage = `${cnt - 1} out of ${countAndNoun(result.length, 'record')} processed`;
            try {
                if (!Array.isArray(data) || (data.length != 2 && data.length != 3)) {
                    if (data.length === 1 && data[0]?.trim() === '') continue; // Skip empty and whitespace rows
                    throw new Error('Not enough CSV columns');
                }
                const email = data[0];
                if (typeof email != 'string' || Validators.email({ value: email } as AbstractControl) != null)
                    throw new Error('Email isn’t a valid email');
                const tokenBalanceChange = parseFloat(data[1] as string);
                if (isNaN(tokenBalanceChange)) throw new Error('Token Balance Change isn’t a number');
                const message = data[2];
                const student = await this.canvasService.getStudentByEmail(this.configuration.course.id, email);
                if (!student) throw new Error('No Student found with this email');
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                this.collectError(data, cnt, err.toString());
                console.log(this.errorCollection);
            }
        }
        console.log('Error CSV Text:', CSVParse.unparse(this.errorCollection));
        this.modalRef?.hide();
    }

    collectError(record: string[], line: number, errorMessage: string) {
        if (this.errorCollection == null) {
            throw new Error('Error collector has not been initialized');
        }
        this.errorCollection.push([...record, `line ${line}`, errorMessage.replaceAll(/[\n\r]/g, '  ')]);
    }
}
