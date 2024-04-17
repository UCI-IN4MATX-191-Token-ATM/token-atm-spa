import {
    Component,
    EnvironmentInjector,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import type { ProcessedRequest } from 'app/data/processed-request';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { CanvasService } from 'app/services/canvas.service';
import { RequestExportInstance, RequestExporterService } from 'app/services/request-exporter.service';
import { createFieldComponentWithLabel } from 'app/token-option-field-component-factories/token-option-field-component-factory';
import type { BsModalRef } from 'ngx-bootstrap/modal';
import { SelectFieldComponent } from '../form-fields/select-field/select-field.component';
import { DateTimeFieldComponent } from '../form-fields/date-time-field/date-time-field.component';
import { compareAsc, set } from 'date-fns';
import { CheckboxFieldComponent } from '../form-fields/checkbox-field/checkbox-field.component';
import type { FormField } from 'app/utils/form-field/form-field';
import type { Student } from 'app/data/student';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';
import { ModalManagerService } from 'app/services/modal-manager.service';
import { v4 as uuidv4 } from 'uuid';
import { ErrorSerializer } from 'app/utils/error-serailizer';
import { OptionalFieldComponent } from '../form-fields/optional-field/optional-field.component';

@Component({
    selector: 'app-export-request-modal',
    templateUrl: './export-request-modal.component.html',
    styleUrls: ['./export-request-modal.component.sass']
})
export class ExportRequestModalComponent implements OnInit, OnDestroy {
    private static IS_TIME_RANGE_FILTER_ENABLED = false;
    private static SAVED_START_TIME = set(new Date(), {
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0
    });

    private static SAVED_END_TIME = set(new Date(), {
        hours: 23,
        minutes: 59,
        seconds: 59,
        milliseconds: 999
    });

    @Input() filter?: (request: ProcessedRequest) => Promise<boolean>;
    @Input() titleSuffix?: string;
    @Input() configuration?: TokenATMConfiguration;
    modalRef?: BsModalRef<unknown>;

    @ViewChild('configFieldContainer', { read: ViewContainerRef, static: true })
    private configFieldContainerRef?: ViewContainerRef;

    isInitialized = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configField?: FormField<any, [string, [Date, Date] | undefined, boolean], any>;
    exportInstance?: RequestExportInstance;
    fileURL?: string;
    fileName?: string;
    message?: string;
    isProcessing = false;

    constructor(
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(EnvironmentInjector) private environmentInjector: EnvironmentInjector,
        @Inject(RequestExporterService) private requestExporterService: RequestExporterService,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService
    ) {}

    async ngOnInit(): Promise<void> {
        if (!this.configuration || !this.configFieldContainerRef)
            throw new Error('Failed to initialize export request modal');
        try {
            const options: [string, string][] = [
                ['Entire Course (in one CSV)', 'course-all'],
                ['Entire Course (one CSV per section)', 'course-section']
            ];
            for await (const section of await this.canvasService.getSections(this.configuration.course.id)) {
                options.push(['Section: ' + section.name, section.id]);
            }
            const [renderer, field] = createFieldComponentWithLabel(
                SelectFieldComponent<string>,
                'Export Scope',
                this.environmentInjector
            )
                .editField((field) => {
                    field.validator = async ([field, value]) => {
                        field.errorMessage = undefined;
                        if (value == undefined) field.errorMessage = 'No option is selected. Please select an option';
                        return value != undefined;
                    };
                })
                .transformDest(async (value) => value as string)
                .appendBuilder(
                    createFieldComponentWithLabel(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        OptionalFieldComponent<
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            FormField<[Date, string, [Date, string]], [Date, Date], any>
                        >,
                        'Specify a time range for requests',
                        this.environmentInjector
                    ).editField((field) => {
                        field.fieldBuilder = createFieldComponentWithLabel(
                            DateTimeFieldComponent,
                            'Include Requests Since',
                            this.environmentInjector
                        )
                            .appendBuilder(
                                createFieldComponentWithLabel(
                                    DateTimeFieldComponent,
                                    'Include Requests Until',
                                    this.environmentInjector
                                )
                            )
                            .appendVP(
                                async (field) =>
                                    <[DateTimeFieldComponent, DateTimeFieldComponent, [Date, Date]]>[
                                        field.fieldA,
                                        field.fieldB,
                                        await field.destValue
                                    ]
                            )
                            .editField((field) => {
                                field.validator = async ([startTimeField, endTimeField, [startTime, endTime]]) => {
                                    if (
                                        startTime == undefined ||
                                        endTime == undefined ||
                                        isNaN(startTime.getTime()) ||
                                        isNaN(endTime.getTime())
                                    )
                                        return false;
                                    if (compareAsc(startTime, endTime) == 1) {
                                        startTimeField.errorMessage =
                                            'Time range is invalid: start time cannot be later than the end time';
                                        endTimeField.errorMessage =
                                            'Time range is invalid: start time cannot be later than the end time';
                                        return false;
                                    }
                                    return true;
                                };
                            });
                    })
                )
                .appendBuilder(
                    createFieldComponentWithLabel(
                        CheckboxFieldComponent,
                        'Include Rejected Requests',
                        this.environmentInjector
                    )
                )
                .build();
            field.srcValue = [
                undefined,
                options,
                [
                    ExportRequestModalComponent.IS_TIME_RANGE_FILTER_ENABLED,
                    [
                        ExportRequestModalComponent.SAVED_START_TIME,
                        this.configuration.course.timeZone,
                        [ExportRequestModalComponent.SAVED_END_TIME, this.configuration.course.timeZone]
                    ]
                ],
                false
            ];
            this.configField = field;
            renderer(this.configFieldContainerRef);
            this.isInitialized = true;
        } catch (err: unknown) {
            await this.modalManagerService.createNotificationModal(
                `Error occurred when initializing export request modal: ${ErrorSerializer.serailize(err)}`,
                'Error'
            );
            this.modalRef?.hide();
        }
    }

    async onExport(): Promise<void> {
        if (!this.configuration || !this.configField) return;
        if (!(await this.configField.validate())) return;
        if (this.exportInstance) return;
        if (this.fileURL != undefined || this.fileName != undefined) return;
        try {
            this.message = undefined;
            this.isProcessing = true;
            this.configField.isReadOnly = true;
            const [scope, dateRange, includeRejected] = await this.configField.destValue;
            ExportRequestModalComponent.IS_TIME_RANGE_FILTER_ENABLED = dateRange != undefined;
            if (dateRange) {
                ExportRequestModalComponent.SAVED_START_TIME = dateRange[0];
                ExportRequestModalComponent.SAVED_END_TIME = dateRange[1];
            }
            const students: Student[] = [];
            let classifier: ((request: ProcessedRequest, student: Student) => Promise<string>) | undefined = undefined;
            switch (scope) {
                case 'course-all': {
                    students.push(
                        ...(await DataConversionHelper.convertAsyncIterableToList(
                            await this.canvasService.getCourseStudentEnrollments(this.configuration.course.id)
                        ))
                    );
                    break;
                }
                case 'course-section': {
                    const studentSectionMapping = new Map<Student, string>();
                    for await (const section of await this.canvasService.getSections(this.configuration.course.id)) {
                        for (const student of await this.canvasService.getSectionStudentsWithEmail(
                            this.configuration.course.id,
                            section.id
                        )) {
                            studentSectionMapping.set(student, section.name);
                            students.push(student);
                        }
                    }
                    classifier = async (_, student) => {
                        return studentSectionMapping.get(student) ?? 'others' + uuidv4();
                    };
                    break;
                }
                default: {
                    students.push(
                        ...(await this.canvasService.getSectionStudentsWithEmail(this.configuration.course.id, scope))
                    );
                    break;
                }
            }
            this.exportInstance = this.requestExporterService.createRequestExportInstance(
                this.configuration,
                students,
                this.titleSuffix,
                async (request: ProcessedRequest) => {
                    if (this.filter && !(await this.filter(request))) return false;
                    if (
                        dateRange &&
                        (compareAsc(dateRange[0], request.submittedTime) == 1 ||
                            compareAsc(request.submittedTime, dateRange[1]) == 1)
                    )
                        return false;
                    if (!includeRejected && !request.isApproved) return false;
                    return true;
                },
                classifier
            );
            this.isProcessing = false;
            const exportedFile = await this.exportInstance.process();
            this.isProcessing = true;
            this.exportInstance = undefined;
            if (exportedFile) {
                this.fileURL = URL.createObjectURL(exportedFile);
                this.fileName = exportedFile.name;
                this.configField.isReadOnly = true;
            } else this.configField.isReadOnly = false;
            if (exportedFile === null)
                this.message =
                    'Export finished, but there are no requests that satisfy the restrictions specified above.';
            this.isProcessing = false;
        } catch (err: unknown) {
            await this.modalManagerService.createNotificationModal(
                `Error occurred when exporting processed requests${
                    this.titleSuffix ? ' for ' + this.titleSuffix : ''
                }: ${ErrorSerializer.serailize(err)}`,
                'Error'
            );
            this.modalRef?.hide();
        }
    }

    async onClearExport(): Promise<void> {
        if (this.fileURL == undefined || !this.configField) return;
        if (
            !(await this.modalManagerService.createConfirmationModalWithoutRef(
                'The existing exported file will be deleted. Do you still want to proceed?'
            ))
        ) {
            return;
        }
        URL.revokeObjectURL(this.fileURL);
        this.fileURL = undefined;
        this.fileName = undefined;
        this.configField.isReadOnly = false;
    }

    onStopExport(): void {
        if (!this.exportInstance) return;
        this.exportInstance.stop();
        this.isProcessing = true;
    }

    ngOnDestroy(): void {
        if (this.fileURL != undefined) URL.revokeObjectURL(this.fileURL);
        this.exportInstance?.stop();
    }
}
