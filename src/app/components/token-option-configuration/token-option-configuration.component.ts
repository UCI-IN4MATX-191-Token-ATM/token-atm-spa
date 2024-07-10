import { Component, Inject, type TemplateRef, ViewChild } from '@angular/core';
import type { Course } from 'app/data/course';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import { type BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';
import { TokenOptionGroupManagementComponent } from '../token-option-group-management/token-option-group-management.component';
import type { GridViewData } from 'app/token-options/mixins/grid-view-data-source-mixin';
import { type CdkDragDrop, moveItemInArray, transferArrayItem, CDK_DRAG_CONFIG } from '@angular/cdk/drag-drop';
import { StorageManagerService } from 'app/services/storage-manager.service';
import { ModalManagerService } from 'app/services/modal-manager.service';
import type { DisplayedColumnsChangedEvent } from 'ag-grid-community';
import { ExportRequestModalComponent } from '../export-request-modal/export-request-modal.component';

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
        @Inject(StorageManagerService) private storageManagerService: StorageManagerService,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService
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

    savedShownColumns: string[] = [];
    savedAvailableColumns: string[] = [];

    curShownColumns?: string[];

    private hasInitializedFromStorage = false;

    @ViewChild('configureGridViewModal') configureGridViewModalTemplate?: TemplateRef<unknown>;
    configureGridViewModalRef?: BsModalRef<unknown>;
    isProcessing = false;

    loadGridViewColumnPreferences() {
        if (!this.configuration) return;
        if (this.storageManagerService.isStorageInitialized && !this.hasInitializedFromStorage) {
            const value = this.storageManagerService.getEntry('gridViewColumnPreferences');
            if (value != undefined) [this.savedShownColumns, this.savedAvailableColumns] = JSON.parse(value);
            this.hasInitializedFromStorage = true;
        }
        const allColSet = new Set(
            this.configuration.tokenOptionGroups
                .flatMap((group) => group.tokenOptions)
                .flatMap((tokenOption) => tokenOption.gridViewData.data.map((entry) => entry.colName))
        );
        const existingColSet = new Set([...this.savedShownColumns, ...this.savedAvailableColumns]);
        this.savedShownColumns = this.savedShownColumns.filter((v) => allColSet.has(v));
        this.savedAvailableColumns = this.savedAvailableColumns.filter((v) => allColSet.has(v));
        this.savedAvailableColumns.push(...Array.from(allColSet).filter((v) => !existingColSet.has(v)));
    }

    async onSwitchToGridView(): Promise<void> {
        if (!this.configuration) return;
        this.loadGridViewColumnPreferences();
        if (this.savedShownColumns.length == 0) {
            await this.modalManagerService.createNotificationModal(
                'No columns are configured for the grid view. Please click the gear button near the top-left corner of the "Token Options" page to configure the grid view.'
            );
            return;
        }
        this.curShownColumns = undefined;
        this.gridViewData = [
            this.configuration.tokenOptionGroups
                .flatMap((group) => group.tokenOptions)
                .map((tokenOption) => tokenOption.gridViewData),
            this.savedShownColumns
        ];
        this.isGridView = true;
    }

    onSwitchToDefaultView() {
        this.isGridView = false;
        this.gridViewData = undefined;
    }

    async onOpenGridViewInNewWindow(): Promise<void> {
        if (!this.configuration) return;
        this.loadGridViewColumnPreferences();
        if (this.savedShownColumns.length == 0) {
            await this.modalManagerService.createNotificationModal(
                'No columns are configured for the grid view. Please click the gear button near the top-left corner of the "Token Options" page to configure the grid view.'
            );
            return;
        }
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
                        this.savedShownColumns
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
        this.shownColumns = this.savedShownColumns.slice(0);
        this.availableColumns = this.savedAvailableColumns.slice(0);
        this.configureGridViewModalRef = this.modalService.show(this.configureGridViewModalTemplate, {
            class: 'modal-lg',
            backdrop: 'static',
            keyboard: false
        });
    }

    onClearShownColumns(): void {
        this.availableColumns.splice(0, 0, ...this.shownColumns);
        this.shownColumns.splice(0, this.shownColumns.length);
    }

    get canSaveGridViewPreferences(): boolean {
        return this.storageManagerService.isStorageInitialized;
    }

    async onSaveGridViewPreferences(): Promise<void> {
        this.isProcessing = true;
        this.savedShownColumns = this.shownColumns.slice(0);
        this.savedAvailableColumns = this.availableColumns.slice(0);
        if (this.canSaveGridViewPreferences) {
            await this.storageManagerService.updateEntry(
                'gridViewColumnPreferences',
                JSON.stringify([this.savedShownColumns, this.savedAvailableColumns])
            );
        }
        this.configureGridViewModalRef?.hide();
        this.isProcessing = false;
    }

    onColumnChange(event: DisplayedColumnsChangedEvent): void {
        this.curShownColumns = event.columnApi
            .getAllDisplayedColumns()
            .map((c) => c.getDefinition().headerName)
            .filter((v) => v != undefined) as string[];
    }

    async onSaveCurColumnPreferences(): Promise<void> {
        if (!this.curShownColumns) return;
        this.isProcessing = true;
        const newColSet = new Set(this.curShownColumns);
        this.savedAvailableColumns.splice(0, 0, ...this.savedShownColumns.filter((v) => !newColSet.has(v)));
        this.savedShownColumns = this.curShownColumns;
        if (this.canSaveGridViewPreferences) {
            await this.storageManagerService.updateEntry(
                'gridViewColumnPreferences',
                JSON.stringify([this.savedShownColumns, this.savedAvailableColumns])
            );
        } else {
            await this.modalManagerService.createNotificationModal(
                'You have not saved credentials with a password, so your column choices won’t be preserved if you leave the "Token Options" page.'
            );
        }
        this.isProcessing = false;
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

    onExportProcessedRequests(): void {
        if (!this.configuration) return;
        const modalRef = this.modalService.show(ExportRequestModalComponent, {
            initialState: {
                configuration: this.configuration,
                titleSuffix: 'All Token Options'
            },
            class: 'modal-lg',
            backdrop: 'static',
            keyboard: false
        });
        if (modalRef.content) modalRef.content.modalRef = modalRef;
    }
}
