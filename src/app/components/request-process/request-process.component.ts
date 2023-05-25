import { Component, Inject } from '@angular/core';
import type { Course } from 'app/data/course';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { ModalManagerService } from 'app/services/modal-manager.service';
import { RequestProcessManagerService } from 'app/services/request-process-manager.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';

@Component({
    selector: 'app-request-process',
    templateUrl: './request-process.component.html',
    styleUrls: ['./request-process.component.sass']
})
export class RequestProcessComponent implements CourseConfigurable {
    course?: Course;
    configuration?: TokenATMConfiguration;
    isReconfigureFinished = true;
    isStopRequested = false;
    progress?: number;
    message?: string;
    individualProgress?: number;
    individualMessage?: string;

    constructor(
        @Inject(TokenATMConfigurationManagerService) private configurationManager: TokenATMConfigurationManagerService,
        @Inject(RequestProcessManagerService) private requestProcessManagerService: RequestProcessManagerService,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService
    ) {}

    async configureCourse(course: Course): Promise<void> {
        this.course = course;
        this.configuration = await this.configurationManager.getTokenATMConfiguration(course);
    }

    public onStopRequestProcessing(): void {
        if (!this.requestProcessManagerService.isRunning) return;
        this.isStopRequested = true;
        this.requestProcessManagerService.stopRequestProcessing();
    }

    public async onStartRequestProcessing(): Promise<void> {
        if (!this.configuration) return;
        this.isReconfigureFinished = false;
        this.isStopRequested = false;
        this.requestProcessManagerService.startRequestProcessing(this.configuration).subscribe({
            next: ([progress, message]: [progress: number, message: string]) => {
                if (progress <= -1) {
                    this.individualProgress = Math.abs(progress + 1) * 100;
                    this.individualMessage = message;
                } else {
                    this.progress = progress;
                    this.message = message;
                }
            },
            complete: () => {
                this.onRequestProcessingComplete();
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error: async ([message, err]: [message: string, err: any]) => {
                await this.modalManagerService.createNotificationModal(message + `\nError message: ${err.toString()}`);
                this.onRequestProcessingComplete(false);
            }
        });
    }

    public async onRequestProcessingComplete(recogfiure = true): Promise<void> {
        this.progress = undefined;
        this.message = undefined;
        this.individualProgress = undefined;
        this.individualMessage = undefined;
        if (this.course && recogfiure) await this.configureCourse(this.course);
        this.isStopRequested = false;
        this.isReconfigureFinished = true;
    }

    get isProcessingRequest(): boolean {
        return this.requestProcessManagerService.isRunning;
    }

    get isRunning(): boolean {
        return (
            (this.requestProcessManagerService.isRunning && this.isStopRequested) ||
            (!this.requestProcessManagerService.isRunning && !this.isReconfigureFinished)
        );
    }
}
