import { Inject, Injectable } from '@angular/core';
import { StudentRecordManagerService } from './student-record-manager.service';
import type { ProcessedRequest } from 'app/data/processed-request';
import type { Student } from 'app/data/student';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { format } from 'date-fns';
import { countAndNoun } from 'app/utils/pluralize';
import { CSVsService } from './csvs.service';
import type { StudentRecord } from 'app/data/student-record';

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
    private studentRecordCache: Map<string, StudentRecord> = new Map<string, StudentRecord>();

    constructor(
        private studentRecordManagerService: StudentRecordManagerService,
        private configuration: TokenATMConfiguration,
        private csvService: CSVsService,
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
        return `Exported requests for ${countAndNoun(this.curProgress, 'student enrollment')}, ${countAndNoun(
            this.students.length - this.curProgress,
            'student enrollment'
        )} remaining`;
    }

    private async getStudentRecord(student: Student): Promise<StudentRecord> {
        if (this.studentRecordCache.has(student.id)) return this.studentRecordCache.get(student.id) as StudentRecord;
        const result = await this.studentRecordManagerService.getStudentRecord(this.configuration, student);
        this.studentRecordCache.set(student.id, result);
        return result;
    }

    public async process(): Promise<File | null | undefined> {
        this.curProgress = 0;
        this.isStopRequested = false;
        this.studentRecordCache.clear();
        const requestDataArray: Record<string, string>[] = [];
        const requestDataMap = new Map<string, Record<string, string>[]>();
        for (const student of this.students) {
            if (this.isStopRequested) {
                this.curProgress = 0;
                this.isStopRequested = false;
                return undefined;
            }
            const studentRecord = await this.getStudentRecord(student);
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
        const fixes = { prefix: 'Token-ATM-Requests-Export', suffix: '' };
        const fName = this.fileName ?? '';
        if (!this.classifier) {
            if (requestDataArray.length == 0) return null;
            return this.csvService.makeFile(new Map([[fName, requestDataArray]]), fixes);
        } else {
            if (requestDataMap.size == 0) return null;
            return this.csvService.makeFile(requestDataMap, undefined, fName, fixes);
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
        @Inject(StudentRecordManagerService) private studentRecordManagerService: StudentRecordManagerService,
        @Inject(CSVsService) private csvService: CSVsService
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
            this.csvService,
            students,
            fileName,
            requestFilter,
            classifier
        );
    }
}
