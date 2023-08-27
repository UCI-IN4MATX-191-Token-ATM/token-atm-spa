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

    errorCollection: string[][] = new Array<string[]>();
    errorsCSVFile?: File;
    errorsCSVURL?: string;

    constructor(
        @Inject(StudentRecordManagerService) private managerService: StudentRecordManagerService,
        @Inject(CanvasService) private canvasService: CanvasService
    ) {}

    onSelectFile(event: Event) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.selectedFile = (event.target as any)?.files[0];
        this.clearErrors();
        this.clearProgress();
    }

    // TODO: - Selectable Columns
    //       - Header Parsing
    //       - Parsing from & Unparsing to Excel formatted CSVs (https://www.papaparse.com/faq#encoding)
    //       - Expose Parser Errors & Meta info (`results.errors` & `results.meta`)
    //          - Allow dry-run functionality to test CSV without updating Token ATM
    //       - Make/Use a type for parsed row data (string[] or JSON[])
    //       - Update parser to use a stream to parse row by row
    //       - Only preserve columns needed by Token ATM in Error CSV
    //       - Use `URL.revokeObjectURL()` on Error CSV URL when modal event onHidden

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
        this.clearErrors();
        for (const data of result) {
            cnt++;
            this.updateProgress(cnt - 1, result.length);
            try {
                if (Array.isArray(data)) {
                    if (data.length === 1 && data[0]?.trim() === '') continue; // Skip empty and whitespace rows
                    if (data.length < 2) throw new Error('Too few CSV columns');
                    if (data.length > 3) throw new Error('Too many CSV columns');
                } else {
                    throw new Error('Unsupported parsed result');
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
        this.updateProgress(cnt, result.length);
        console.log('Error CSV Text:', CSVParse.unparse(this.errorCollection));
        this.makeErrorCSV();
        this.isProcessing = false;
        // this.modalRef?.hide();
    }

    collectError(record: string[], line: number, errorMessage: string) {
        if (this.errorCollection == null) {
            throw new Error('Error collector has not been initialized');
        }
        this.errorCollection.push([...record, `line ${line}`, errorMessage.replaceAll(/[\n\r]/g, '  ')]);
    }

    makeErrorCSV() {
        if (this.errorCollection == null || this.errorCollection.length == 0) return;

        this.errorsCSVFile = new File(
            [CSVParse.unparse(this.errorCollection)],
            `${this.cleanName(this.selectedFile?.name)}-Errors-${this.cleanName(new Date().toISOString())}.csv`,
            { type: 'text/csv;charset=utf-8;' }
        );
        this.errorsCSVURL = window.URL.createObjectURL(this.errorsCSVFile);
        // window.URL.revokeObjectURL(this.errorsCSVURL);
    }

    clearErrors() {
        this.errorCollection = new Array<string[]>();
        if (this.errorsCSVURL) window.URL.revokeObjectURL(this.errorsCSVURL);
        this.errorsCSVFile = undefined;
        this.errorsCSVURL = undefined;
    }

    clearProgress() {
        this.progress = undefined;
        this.progressMessage = undefined;
    }

    updateProgress(current: number, total: number) {
        this.progress = ((current / total) * 100).toFixed(2);
        this.progressMessage = `${current} out of ${countAndNoun(total, 'record')} processed`;
    }

    errorMessage(errorCount: number): string {
        return `${countAndNoun(errorCount, 'error')} occured while processing`;
    }

    cleanName(name?: string): string {
        if (name == null) return 'Batch_CSV';
        const cleanExpr = /\..{3,}?$|:/gm;
        return name.replaceAll(cleanExpr, '');
    }
}
