import { Inject, Injectable } from '@angular/core';
import { StudentRecordManagerService } from './student-record-manager.service';
import type { ProcessedRequest } from 'app/data/processed-request';
import type { Student } from 'app/data/student';
import * as CSVParse from 'papaparse';
import ZipFile from 'jszip';
import sanitizeFileName from 'sanitize-filename';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { format } from 'date-fns';
import { countAndNoun } from 'app/utils/pluralize';

export function parseProcessedRequest(processedRequest: ProcessedRequest): Record<string, string> {
    return {
        'Token Option Name': processedRequest.tokenOptionName,
        'Student Name': processedRequest.student.name,
        'Student Email': processedRequest.student.email,
        'Is Approved': processedRequest.isApproved ? 'Yes' : 'No',
        'Request Submitted At': format(processedRequest.submittedTime, 'MMM dd, yyyy HH:mm:ss'),
        'Request Processed At': format(processedRequest.processedTime, 'MMM dd, yyyy HH:mm:ss'),
        'Token Balance Change': processedRequest.tokenBalanceChange.toString(),
        Message: processedRequest.message
    };
}

export class RequestExportInstance {
    private curProgress = 0;
    private isStopRequested = false;

    constructor(
        private studentRecordManagerService: StudentRecordManagerService,
        private configuration: TokenATMConfiguration,
        private students: Student[],
        private fileName?: string,
        private requestFilter?: (request: ProcessedRequest) => Promise<boolean>,
        private classifier?: (request: ProcessedRequest, student: Student) => Promise<string>
    ) {}

    public get progress(): number {
        return this.students.length == 0 ? 1 : this.curProgress / this.students.length;
    }

    public get progressDescription(): string {
        if (this.students.length == 0) return '';
        return `Exported request(s) for ${countAndNoun(this.curProgress, 'student enrollment')}, ${countAndNoun(
            this.students.length - this.curProgress,
            'student enrollment'
        )} remaining`;
    }

    public async process(): Promise<File | null | undefined> {
        this.curProgress = 0;
        this.isStopRequested = false;
        const requestDataArray: Record<string, string>[] = [];
        const requestDataMap = new Map<string, Record<string, string>[]>();
        for (const student of this.students) {
            if (this.isStopRequested) {
                this.curProgress = 0;
                this.isStopRequested = false;
                return undefined;
            }
            const studentRecord = await this.studentRecordManagerService.getStudentRecord(this.configuration, student);
            for (const request of studentRecord.processedRequests) {
                if (this.isStopRequested) {
                    this.curProgress = 0;
                    this.isStopRequested = false;
                    return undefined;
                }
                if (this.requestFilter != undefined && !(await this.requestFilter(request))) continue;
                if (!this.classifier) {
                    requestDataArray.push(parseProcessedRequest(request));
                    continue;
                }
                const groupName = await this.classifier(request, student);
                if (!requestDataMap.has(groupName)) requestDataMap.set(groupName, []);
                requestDataMap.get(groupName)?.push(parseProcessedRequest(request));
            }
            this.curProgress++;
        }
        const fileName = `Token-ATM-Requests-Export-${
            this.fileName ? sanitizeFileName(this.fileName) + '-' : '' + format(new Date(), 'MM-dd-yyyy-HH-mm-ss')
        }`;
        if (!this.classifier) {
            if (requestDataArray.length == 0) return null;
            return new File([CSVParse.unparse(requestDataArray)], fileName + '.csv', {
                type: 'text/csv;charset=utf-8;'
            });
        } else {
            if (requestDataMap.size == 0) return null;
            const zipFile = new ZipFile();
            for (const [groupName, data] of requestDataMap.entries()) {
                zipFile.file(sanitizeFileName(groupName) + '.csv', CSVParse.unparse(data));
            }
            return new File([await zipFile.generateAsync({ type: 'blob' })], fileName + '.zip', {
                type: 'application/zip'
            });
        }
    }

    public stop(): void {
        this.isStopRequested = true;
    }
}

@Injectable({
    providedIn: 'root'
})
export class RequestExporterService {
    constructor(
        @Inject(StudentRecordManagerService) private studentRecordManagerService: StudentRecordManagerService
    ) {}

    public createRequestExportInstance(
        configuration: TokenATMConfiguration,
        students: Student[],
        fileName?: string,
        requestFilter?: (request: ProcessedRequest) => Promise<boolean>,
        classifier?: (request: ProcessedRequest, student: Student) => Promise<string>
    ): RequestExportInstance {
        return new RequestExportInstance(
            this.studentRecordManagerService,
            configuration,
            students,
            fileName,
            requestFilter,
            classifier
        );
    }
}