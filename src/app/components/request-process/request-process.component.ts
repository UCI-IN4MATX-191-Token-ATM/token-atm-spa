import { Component, Inject, type TemplateRef, ViewChild } from '@angular/core';
import type { Course } from 'app/data/course';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { ModalManagerService } from 'app/services/modal-manager.service';
import { RequestProcessManagerService } from 'app/services/request-process-manager.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';
import { ErrorSerializer } from 'app/utils/error-serializer';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CredentialManagerService } from 'app/services/credential-manager.service';
import { checkAndConfirmTokenATMLogPublished } from 'app/utils/reusable-modals';

@Component({
    selector: 'app-request-process',
    templateUrl: './request-process.component.html',
    styleUrls: ['./request-process.component.sass']
})
export class RequestProcessComponent implements CourseConfigurable {
    course?: Course;
    configuration?: TokenATMConfiguration;
    isProcessing = false;
    progress?: number;
    message?: string;
    individualProgress?: number;
    individualMessage?: string;

    @ViewChild('missingCredentialModal') private missingCredentialModalTemplate?: TemplateRef<unknown>;
    missingCredentialMsg?: string;
    missingCredentialPromiseResolve?: (v: string) => void;

    constructor(
        @Inject(TokenATMConfigurationManagerService) private configurationManager: TokenATMConfigurationManagerService,
        @Inject(RequestProcessManagerService) private requestProcessManagerService: RequestProcessManagerService,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService,
        @Inject(BsModalService) private modalService: BsModalService,
        @Inject(CredentialManagerService) private credentialManagerService: CredentialManagerService,
        @Inject(Router) private router: Router
    ) {}

    async configureCourse(course: Course): Promise<void> {
        this.course = course;
        this.configuration = await this.configurationManager.getTokenATMConfiguration(course);
    }

    public onStopRequestProcessing(): void {
        if (!this.requestProcessManagerService.isRunning) return;
        this.isProcessing = true;
        this.requestProcessManagerService.stopRequestProcessing();
    }

    public async onStartRequestProcessing(): Promise<void> {
        if (!this.configuration) return;
        this.isProcessing = true;
        if (!(await this.checkMissingCredentials())) {
            this.isProcessing = false;
            return;
        }
        if (
            !(await checkAndConfirmTokenATMLogPublished(
                'process student requests',
                this.configuration,
                this.configurationManager,
                this.modalManagerService
            ))
        ) {
            this.isProcessing = false;
            return;
        }
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
            complete: async () => {
                await this.onRequestProcessingComplete();
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error: async ([message, err]: [message: string, err: any]) => {
                await this.modalManagerService.createNotificationModal(
                    message + `\n______________\nError message: ${ErrorSerializer.serialize(err)}`
                );
                await this.onRequestProcessingComplete(false);
            }
        });
        this.isProcessing = false;
    }

    public async onRequestProcessingComplete(reconfigure = true): Promise<void> {
        this.progress = undefined;
        this.message = undefined;
        this.individualProgress = undefined;
        this.individualMessage = undefined;
        this.isProcessing = true;
        if (this.course && reconfigure) await this.configureCourse(this.course);
        this.isProcessing = false;
    }

    get isProcessingRequest(): boolean {
        return this.requestProcessManagerService.isRunning;
    }

    private async checkMissingCredentials(): Promise<boolean> {
        if (!this.configuration) return false;
        if (!this.missingCredentialModalTemplate) return false;
        const missingCredentials = new Set<string>();
        this.configuration.tokenOptionGroups.forEach((group) =>
            group.tokenOptions.forEach((option) =>
                this.credentialManagerService
                    .getMissingCredentialsDescription(option)
                    .forEach((v) => missingCredentials.add(v))
            )
        );
        if (missingCredentials.size == 0) return true;
        this.missingCredentialMsg = [...missingCredentials].join(', ');
        const promise = new Promise<string>((resolve) => (this.missingCredentialPromiseResolve = resolve));
        const modalRef = this.modalService.show(this.missingCredentialModalTemplate, {
            backdrop: 'static',
            keyboard: false
        });
        const onHiddenPromise = modalRef.onHidden ? firstValueFrom(modalRef.onHidden) : undefined;
        const result = await promise;
        modalRef.hide();
        if (onHiddenPromise) await onHiddenPromise;
        switch (result) {
            case 'proceed':
                return true;
            case 'login': {
                this.credentialManagerService.clear();
                this.router.navigate(['/login']);
                return false;
            }
            default:
                return false;
        }
    }
}
