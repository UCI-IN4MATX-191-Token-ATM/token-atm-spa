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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errorCollection?: (string[] | any)[];
    errorsCSVFile?: File;
    errorsCSVURL?: string;

    reportWholeLine = false;
    hasHeader = false;

    firstRow?: string[];
    possibleColumnIndex: {
        email?: number;
        balanceChange?: number;
        message?: number;
    } = {};
    columnsUsed: {
        email: string;
        balanceChange: string;
        message?: string;
    } = { email: '0', balanceChange: '1', message: undefined };

    private baselineConfig = {
        skipEmptyLines: true,
        dynamicTyping: false
    };

    constructor(
        @Inject(StudentRecordManagerService) private managerService: StudentRecordManagerService,
        @Inject(CanvasService) private canvasService: CanvasService
    ) {}

    async parseCSV(file: File, options?: object) {
        let promiseResolve: (results: CSVParse.ParseResult<unknown>) => void;
        const promise = new Promise<CSVParse.ParseResult<unknown>>((resolve) => {
            promiseResolve = resolve;
        });
        CSVParse.parse(file, {
            ...this.baselineConfig,
            ...options,
            complete: async (results) => {
                promiseResolve(results);
            }
        });
        return promise;
    }

    async onSelectFile(event: Event) {
        this.isProcessing = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.selectedFile = (event.target as any)?.files[0];
        this.clearErrors();
        this.clearProgress();
        const setPossibleHeaders = (results: CSVParse.ParseResult<unknown>) => {
            if (this.hasHeader) this.firstRow = results.meta?.fields;
            else {
                this.firstRow = results.data[0] as string[];
            }
        };
        if (this.selectedFile) {
            const results = await this.parseCSV(this.selectedFile, { header: this.hasHeader, preview: 1 });
            setPossibleHeaders(results);
            console.log("File's First Row:", this.firstRow);
            if (Array.isArray(this.firstRow)) {
                // Check for matching Token ATM CSV Column Names
                const normed = this.firstRow.map((x) => x.toLowerCase());
                const email_str = 'student email';
                const change_str = 'token balance change';
                const message_str = 'message';
                const present = normed.filter((x) => x === email_str || x === change_str || x === message_str);

                console.log('Matched Headers:', present);
                const getIndex = (match_str: string): number | undefined => {
                    const idx = normed.indexOf(match_str);
                    return idx === -1 ? undefined : idx;
                };

                // Set the possible indexes for needed columns
                this.possibleColumnIndex = {
                    email: getIndex(email_str),
                    balanceChange: getIndex(change_str),
                    message: getIndex(message_str)
                };
                // From the possible indexes, return the matching header names
                const namesUsed = (strings: string[]) => {
                    return Object.fromEntries(
                        Object.entries(this.possibleColumnIndex).map(([k, v]) => [k, strings[v]])
                    );
                };
                // If a matching header name is found, update to assume headers exists
                if (!this.hasHeader && present.length > 1) {
                    this.hasHeader = true;
                }
                // If there aren't headers, but there are more than 2 columns, assume the 3rd is for a message
                if (!this.hasHeader && this.firstRow.length > 2) {
                    if (this.columnsUsed.message == null) {
                        this.columnsUsed.message = '2';
                    }
                }

                // Temporarily connect possibleColumnIndex with columnsUsed
                // Will be replaced with header selection UI in future
                // Be careful to handle the case of a previous import having headers
                // and the next csv not having a header.
                if (this.hasHeader) {
                    this.columnsUsed = namesUsed(this.firstRow) as {
                        email: string;
                        balanceChange: string;
                        message?: string;
                    };
                }
            }
        }
        this.isProcessing = false;
    }

    // TODO: - Select from Possible Headers/Columns in UI
    //          - Use possibleColumnIndex for preview/preselection
    //          - Update columnsUsed with actual user selections (w/ index as a string)
    //       - Set Flags from UI
    //          - reportWholeLine (boolean, if the entire parsed line should be in the error report)
    //          - hasHeader(boolean, if the parser should assume there is a CSV header)
    //       - Parsing from & Unparsing to Excel formatted CSVs (https://www.papaparse.com/faq#encoding)
    //       - Expose Parser Errors & Meta info (`results.errors` & `results.meta`)
    //          - Allow dry-run functionality to test CSV without updating Token ATM
    //       - Update parser to use a stream to parse row by row (makes progress indeterminate)
    //       - Use `URL.revokeObjectURL()` on Error CSV URL when modal event onHidden

    async onImportCSV() {
        if (!this.selectedFile || !this.configuration) return;
        this.isProcessing = true;
        const results = await this.parseCSV(this.selectedFile, { header: this.hasHeader });
        let cnt = 0;
        this.clearErrors();
        for (const record of results.data) {
            cnt++;
            this.updateProgress(cnt - 1, results.data.length);
            const data = new Array<string>();

            // Use `record: any` to access index and properties via strings
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const obj: any = record;
            data[0] = obj[this.columnsUsed.email];
            data[1] = obj[this.columnsUsed.balanceChange];
            if (this.columnsUsed.message != null) {
                data[2] = obj[this.columnsUsed.message];
            }
            try {
                if (Array.isArray(data)) {
                    // if (data.length === 1 && data[0]?.trim() === '') continue; // Skip empty and whitespace rows
                    if (data.length < 2) throw new Error('Too few columns picked');
                    if (data.length > 3) throw new Error('Too many columns picked');
                } else {
                    throw new Error('Unsupported parsed result');
                }
                const email = data[0];
                if (typeof email != 'string' || Validators.email({ value: email } as AbstractControl) != null)
                    throw new Error('Student Email isn’t an email');
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
                if (this.errorCollection == null) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    this.errorCollection = this.hasHeader ? new Array<any>() : new Array<string[]>();
                }
                if (this.reportWholeLine) {
                    this.collectError(record, cnt, err.toString());
                } else {
                    let line;
                    if (this.hasHeader) {
                        line = Object.fromEntries([
                            [this.columnsUsed.email, data[0]],
                            [this.columnsUsed.balanceChange, data[1]],
                            [this.columnsUsed.message, data[2]]
                        ]);
                        delete line['undefined'];
                    } else {
                        line = data;
                    }
                    this.collectError(line, cnt, err.toString());
                }
            }
        }
        this.updateProgress(cnt, results.data.length);
        if (this.errorCollection) {
            console.log('Error CSV Text:', CSVParse.unparse(this.errorCollection));
        }
        this.makeErrorCSV();
        this.isProcessing = false;
        // this.modalRef?.hide();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collectError(record: string[] | any, line: number, errorMessage: string) {
        if (this.errorCollection == null) {
            throw new Error('Error collector has not been initialized');
        }
        const noLinebreaks = errorMessage.replaceAll(/[\n\r]/g, '  ');
        if (Array.isArray(record)) {
            this.errorCollection.push([...record, `line ${line}`, noLinebreaks]);
        } else {
            this.errorCollection.push({
                ...record,
                Line: `${line}`,
                Error: noLinebreaks
            });
        }
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
        this.errorCollection = undefined;
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
        if (errorCount === 0) return '';
        return `${countAndNoun(errorCount, 'error')} occured while processing`;
    }

    cleanName(name?: string): string {
        if (name == null) return 'Batch_CSV';
        const cleanExpr = /\..{3,}?$|:/gm;
        return name.replaceAll(cleanExpr, '');
    }
}
