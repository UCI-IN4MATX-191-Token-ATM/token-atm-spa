import { Component, Inject, TemplateRef, ViewChild } from '@angular/core';
import type { Course } from 'app/data/course';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';
import { TokenOptionGroupManagementComponent } from '../token-option-group-management/token-option-group-management.component';
import type { GridViewData } from 'app/token-options/mixins/grid-view-data-source-mixin';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CDK_DRAG_CONFIG } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';
import { CredentialManagerService } from 'app/services/credential-manager.service';

@Component({
    selector: 'app-token-option-configuration',
    templateUrl: './token-option-configuration.component.html',
    styleUrls: ['./token-option-configuration.component.sass'],
    providers: [
        {
            provide: CDK_DRAG_CONFIG,
            useValue: {
                zIndex: 10000
            }
        }
    ]
})
export class TokenOptionConfigurationComponent implements CourseConfigurable {
    course?: Course;
    configuration?: TokenATMConfiguration;

    isGridView = false;
    gridViewData?: [GridViewData[], string[]];

    constructor(
        @Inject(TokenATMConfigurationManagerService)
        private configurationManagerService: TokenATMConfigurationManagerService,
        @Inject(BsModalService) private modalService: BsModalService,
        @Inject(CredentialManagerService) private credentialManagerService: CredentialManagerService
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

    shownColumns: string[] = [];
    availableColumns: string[] = [];
    private isGridViewPreferencesLoaded = false;
    @ViewChild('configureGridViewModal') configureGridViewModalTemplate?: TemplateRef<unknown>;
    configureGridViewModalRef?: BsModalRef<unknown>;

    loadGridViewColumnPreferences() {
        if (this.isGridViewPreferencesLoaded) return;
        this.isGridViewPreferencesLoaded = true;
        if (this.credentialManagerService.isStorageInitialized) {
            const value = this.credentialManagerService.getEntry('gridViewColumnPerferences');
            if (value != undefined) [this.shownColumns, this.availableColumns] = JSON.parse(value);
            this.isGridViewPreferencesLoaded = true;
        }
    }

    onSwitchToGridView(): void {
        if (!this.configuration) return;
        this.loadGridViewColumnPreferences();
        this.gridViewData = [
            this.configuration.tokenOptionGroups
                .flatMap((group) => group.tokenOptions)
                .map((tokenOption) => tokenOption.gridViewData),
            this.shownColumns
        ];
        this.isGridView = true;
    }

    onSwitchToDefaultView() {
        this.isGridView = false;
        this.gridViewData = undefined;
    }

    onOpenGridViewInNewWindow(): void {
        if (!this.configuration) return;
        this.loadGridViewColumnPreferences();
        const windowRef = window.open(document.baseURI + 'grid-view', '_blank');
        windowRef?.addEventListener(
            'DOMContentLoaded',
            () => {
                if (!this.configuration) return;
                windowRef?.postMessage({
                    type: 'GRID_VIEW_DATA',
                    value: [
                        this.configuration.tokenOptionGroups
                            .flatMap((group) => group.tokenOptions)
                            .map((tokenOption) => tokenOption.gridViewData),
                        this.shownColumns
                    ]
                });
            },
            {
                once: true
            }
        );
    }

    // https://material.angular.io/cdk/drag-drop/overview#transferring-items-between-lists
    async onConfigureGridView(): Promise<void> {
        if (!this.configuration || !this.configureGridViewModalTemplate) return;
        this.loadGridViewColumnPreferences();
        const allColSet = new Set(
            this.configuration.tokenOptionGroups
                .flatMap((group) => group.tokenOptions)
                .flatMap((tokenOption) => tokenOption.gridViewData.data.map((entry) => entry.colName))
        );
        const existingColSet = new Set([...this.shownColumns, ...this.availableColumns]);
        this.shownColumns = this.shownColumns.filter((v) => allColSet.has(v));
        this.availableColumns = this.availableColumns.filter((v) => allColSet.has(v));
        this.availableColumns.push(...Array.from(allColSet).filter((v) => !existingColSet.has(v)));
        this.configureGridViewModalRef = this.modalService.show(this.configureGridViewModalTemplate, {
            class: 'modal-lg'
        });
        if (!this.configureGridViewModalRef.onHide) throw new Error('Invalid modal ref');
        await firstValueFrom(this.configureGridViewModalRef.onHide);
        this.credentialManagerService.updateEntry(
            'gridViewColumnPerferences',
            JSON.stringify([this.shownColumns, this.availableColumns])
        );
    }

    drop(event: CdkDragDrop<string[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
        }
    }
}
