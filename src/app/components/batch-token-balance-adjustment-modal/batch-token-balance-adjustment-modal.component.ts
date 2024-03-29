import { Component, Inject, Input, OnDestroy } from '@angular/core';
import { ProcessedRequest } from 'app/data/processed-request';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { CanvasService } from 'app/services/canvas.service';
import { StudentRecordManagerService } from 'app/services/student-record-manager.service';
import { countAndNoun } from 'app/utils/pluralize';
import type { BsModalRef } from 'ngx-bootstrap/modal';
import type { ParseResult } from 'papaparse';
import { AbstractControl, Validators } from '@angular/forms';
import { CSVsService } from 'app/services/csvs.service';

type PreviewColumnsIndex = {
    email?: number;
    balanceChange?: number;
    message?: number;
};
type MandatoryColumns = {
    email: number;
    balanceChange: number;
    message?: number;
};

@Component({
    selector: 'app-batch-token-balance-adjustment-modal',
    templateUrl: './batch-token-balance-adjustment-modal.component.html',
    styleUrls: ['./batch-token-balance-adjustment-modal.component.sass']
})
export class BatchTokenBalanceAdjustmentModalComponent implements OnDestroy {
    isProcessing = false;
    @Input() configuration?: TokenATMConfiguration;
    modalRef?: BsModalRef<unknown>;

    selectedFile?: File;
    progress?: string;
    progressMessage?: string;
    displayKeys = ['email', 'balanceChange', 'message'];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errorCollection?: (string[] | any)[];
    errorsCSVFile?: File;
    errorsCSVURL?: string;

    reportWholeLine = false;
    hasHeader = false;
    hasStarted = false;

    firstRow?: string[];
    possibleColumnIndex: PreviewColumnsIndex = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    possibleColumnsUsed: any = {};
    columnsUsed?: MandatoryColumns;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    firstResult?: string[] | any;

    constructor(
        @Inject(StudentRecordManagerService) private managerService: StudentRecordManagerService,
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(CSVsService) private csvService: CSVsService
    ) {}

    async onSelectFile(event: Event) {
        this.isProcessing = true;
        this.hasStarted = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.selectedFile = (event.target as any)?.files[0];
        this.clearErrors();
        this.clearProgress();
        this.clearPreview();
        // TODO: Remove Header reset once UI Interaction and User Toggle-able Headers work
        this.hasHeader = false;
        const setPossibleHeaders = (results: ParseResult<unknown>) => {
            if (this.hasHeader) this.firstRow = results.meta?.fields;
            else {
                this.firstRow = results.data[0] as string[];
            }
        };
        if (this.selectedFile) {
            const results = await this.csvService.parseCSV(this.selectedFile, { header: this.hasHeader, preview: 2 });
            setPossibleHeaders(results);
            // console.log('File’s First Row:', this.firstRow);
            // console.log('Results:', results);
            if (Array.isArray(this.firstRow)) {
                // Check for matching Token ATM CSV Column Names
                const normed = this.firstRow.map((x) => x.toLowerCase());
                const email_str = 'student email';
                const change_str = 'token balance change';
                const message_str = 'message';
                const present = normed.filter((x) => x === email_str || x === change_str || x === message_str);

                // console.log('Matched Headers:', present);
                const getIndex = (match_str: string): number | undefined => {
                    const idx = normed.indexOf(match_str);
                    return idx === -1 ? undefined : idx;
                };

                // Set the possible indexes for columns
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

                // Temporarily connect possibleColumnUsed with columnsUsed
                // Will be replaced with header selection UI in future
                // Be careful to handle the case of a previous import having headers
                // and the next csv not having a header.
                const updatePreview = (data: unknown[]) => {
                    if (this.firstRow == null) return;
                    if (this.hasHeader) {
                        this.possibleColumnsUsed = namesUsed(this.firstRow);
                        if (Array.isArray(data[0])) {
                            // Handle when headers are programmatically found and assigned
                            const firstData = data[1] as string[];
                            this.firstResult = {};
                            if (this.possibleColumnsUsed.email != null && this.possibleColumnIndex.email != null) {
                                this.firstResult[this.possibleColumnsUsed.email] =
                                    firstData[this.possibleColumnIndex.email];
                            }
                            if (
                                this.possibleColumnsUsed.balanceChange != null &&
                                this.possibleColumnIndex.balanceChange != null
                            ) {
                                this.firstResult[this.possibleColumnsUsed.balanceChange] =
                                    firstData[this.possibleColumnIndex.balanceChange];
                            }
                            if (this.possibleColumnsUsed.message != null && this.possibleColumnIndex.message != null) {
                                this.firstResult[this.possibleColumnsUsed.message] =
                                    firstData[this.possibleColumnIndex.message];
                            }
                        } else {
                            this.firstResult = data[0];
                        }
                    } else {
                        // Default for no existing headers
                        this.possibleColumnsUsed =
                            this.firstRow.length == 0
                                ? {}
                                : this.firstRow.length == 1
                                ? { email: '0' }
                                : this.firstRow.length == 2
                                ? { email: '0', balanceChange: '1' }
                                : { email: '0', balanceChange: '1', message: '2' };
                        this.firstResult = this.firstRow as string[];
                    }
                    // console.log('Columns:', this.columnsUsed, '\nPreview Result:', this.firstResult);
                };
                updatePreview(results.data);
                if (this.possibleColumnsUsed.email != null && this.possibleColumnsUsed.balanceChange != null) {
                    // Update columnsUsed for actual import
                    this.columnsUsed = this.possibleColumnsUsed as MandatoryColumns;
                }
            }
        }
        this.isProcessing = false;
    }

    // TODO: - Select from Possible Headers/Columns in UI
    //          - Use possibleColumnIndex for preselection
    //          - Use possibleColumnUsed for preview
    //          - Update columnsUsed with actual user selections (w/ index as a string)
    //          - Disable interactions (header/column selection) once Import begins
    //       - Handle user turning headers off/on
    //       - Allow dry-run functionality to test CSV without updating Token ATM

    async onImportCSV() {
        if (!this.selectedFile || !this.configuration || !this.columnsUsed) return;
        this.isProcessing = true;
        this.hasStarted = true;
        const results = await this.csvService.parseCSV(this.selectedFile, { header: this.hasHeader });
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
        await this.makeErrorCSV();
        this.isProcessing = false;
        // this.modalRef?.hide();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collectError(record: string[] | any, line: number, errorMessage: string) {
        if (this.errorCollection == null) {
            throw new Error('Error collector has not been initialized');
        }
        const errorNoLinebreaks = errorMessage.replaceAll(/[\n\r]/g, '  ');
        if (Array.isArray(record)) {
            this.errorCollection.push([...record, `line ${line}`, errorNoLinebreaks]);
        } else {
            this.errorCollection.push({
                ...record,
                Line: `${line}`,
                Error: errorNoLinebreaks
            });
        }
    }

    async makeErrorCSV() {
        if (this.errorCollection == null || this.errorCollection.length == 0) return;

        const importedFileName = this.selectedFile?.name ?? 'Batch-CSV';
        this.errorsCSVFile = await this.csvService.makeFile(new Map([[importedFileName, this.errorCollection]]), {
            prefix: '',
            suffix: 'Import-Errors'
        });
        this.errorsCSVURL = window.URL.createObjectURL(this.errorsCSVFile);
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

    clearPreview() {
        this.firstRow = undefined;
        this.possibleColumnIndex = {};
        this.columnsUsed = undefined;
        this.firstResult = undefined;
        this.possibleColumnsUsed = {};
    }

    clearAll() {
        this.clearErrors();
        this.clearPreview();
        this.clearProgress();
    }

    updateProgress(current: number, total: number) {
        this.progress = ((current / total) * 100).toFixed(2);
        this.progressMessage = `${current} out of ${countAndNoun(total, 'record')} processed`;
    }

    errorMessage(errorCount: number): string {
        if (errorCount === 0) return '';
        return `${countAndNoun(errorCount, 'error')} occured while processing`;
    }

    ngOnDestroy(): void {
        this.clearAll();
    }
}
