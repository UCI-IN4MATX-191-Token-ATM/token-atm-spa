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

    constructor(
        @Inject(TokenATMConfigurationManagerService) private configurationManager: TokenATMConfigurationManagerService,
        @Inject(RequestProcessManagerService) private requestProcessManagerService: RequestProcessManagerService
    ) {}

    async configureCourse(course: Course): Promise<void> {
        this.course = course;
        this.configuration = await this.configurationManager.getTokenATMConfiguration(course);
    }

    public async onStartRequestProcessing(): Promise<void> {
        if (!this.configuration) return;
        this.isReconfigureFinished = false;
        await this.requestProcessManagerService.startRequestProcessing(this.configuration);
        if (this.course) await this.configureCourse(this.course);
        this.isReconfigureFinished = true;
    }

    get isRunning(): boolean {
        return this.requestProcessManagerService.isRunning || !this.isReconfigureFinished;
    }
}
