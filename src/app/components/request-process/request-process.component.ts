import { Component, Inject } from '@angular/core';
import type { Course } from 'app/data/course';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
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

    constructor(
        @Inject(TokenATMConfigurationManagerService) private configurationManager: TokenATMConfigurationManagerService,
        @Inject(RequestProcessManagerService) private requestProcessManagerService: RequestProcessManagerService
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
                this.progress = progress;
                this.message = message;
            },
            complete: () => {
                this.onRequestProcessingComplete();
            }
        });
    }

    public async onRequestProcessingComplete(): Promise<void> {
        this.progress = undefined;
        this.message = undefined;
        if (this.course) await this.configureCourse(this.course);
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
