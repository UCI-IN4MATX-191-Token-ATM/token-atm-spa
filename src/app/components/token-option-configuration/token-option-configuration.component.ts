import { Component, Inject } from '@angular/core';
import type { Course } from 'app/data/course';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';
import { TokenOptionGroupManagementComponent } from '../token-option-group-management/token-option-group-management.component';

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
        private configurationManagerService: TokenATMConfigurationManagerService,
        @Inject(BsModalService) private modalService: BsModalService
    ) {}

    async configureCourse(course: Course): Promise<void> {
        this.course = course;
        this.configuration = await this.configurationManagerService.getTokenATMConfiguration(this.course);
    }

    onCreateTokenOptionGroup(): void {
        if (!this.configuration) return;
        const modalRef = this.modalService.show(TokenOptionGroupManagementComponent, {
            initialState: {
                value: this.configuration
            }
        });
        if (modalRef.content) modalRef.content.modalRef = modalRef;
    }
}
