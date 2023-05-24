import { Component, Inject } from '@angular/core';
import type { Course } from 'app/data/course';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';

@Component({
    selector: 'app-token-option-configuration',
    templateUrl: './token-option-configuration.component.html',
    styleUrls: ['./token-option-configuration.component.sass']
})
export class TokenOptionConfigurationComponent implements CourseConfigurable {
    course?: Course;
    configuration?: TokenATMConfiguration;
    constructor(
        @Inject(TokenATMConfigurationManagerService)
        private configurationManagerService: TokenATMConfigurationManagerService
    ) {}

    async configureCourse(course: Course): Promise<void> {
        this.course = course;
        this.configuration = await this.configurationManagerService.getTokenATMConfiguration(this.course);
    }
}
