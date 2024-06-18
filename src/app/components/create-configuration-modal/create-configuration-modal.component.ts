import { Component, EnvironmentInjector, Inject, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import type { Course } from 'app/data/course';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import { StringInputFieldComponent } from '../form-fields/string-input-field/string-input-field.component';
import { StringTextareaFieldComponent } from '../form-fields/string-textarea-field/string-textarea-field.component';
import type { FormField } from 'app/utils/form-field/form-field';
import { createFieldComponentWithLabel } from 'app/token-options/token-option-field-component-factory';

@Component({
    selector: 'app-create-configuration-modal',
    templateUrl: './create-configuration-modal.component.html',
    styleUrls: ['./create-configuration-modal.component.sass']
})
export class CreateConfigurationModalComponent implements OnInit {
    private _isProcessing = false;
    @Input() onResolve?: (reuslt: boolean) => void;
    @Input() course?: Course;

    @ViewChild('container', { read: ViewContainerRef, static: true }) container?: ViewContainerRef;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field?: FormField<Course, [string, string], any>;

    constructor(
        @Inject(TokenATMConfigurationManagerService)
        private configurationManagerService: TokenATMConfigurationManagerService,
        @Inject(EnvironmentInjector) private environmentInjector: EnvironmentInjector
    ) {}

    ngOnInit(): void {
        if (!this.course || !this.container) throw new Error('Failed to initialize create configuration modal'); // TODO: Double check phrasing
        // TODO: Add Preview for what the entire name string looks like, including Prefix and Suffix
        const [renderer, field] = createFieldComponentWithLabel(
            StringInputFieldComponent,
            'A suffix for the Canvas Assignment Group & Module names',
            this.environmentInjector
        )
            .appendBuilder(
                createFieldComponentWithLabel(
                    StringTextareaFieldComponent,
                    'Description for Token ATM Log Assignment on Canvas',
                    this.environmentInjector
                )
            )
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .transformSrc<Course>(() => {
                return ['', ''];
            })
            .build();
        this.field = field;
        this.field.srcValue = this.course;
        renderer(this.container);
    }

    onCancel() {
        if (this.onResolve) this.onResolve(false);
    }

    async onCreateConfiguration(): Promise<void> {
        if (!this.course || !this.field || !this.onResolve) return;
        this.isProcessing = true;
        if (!(await this.field.validate())) {
            this.isProcessing = false;
            return;
        }
        const [suffix, description] = await this.field.destValue;
        await this.configurationManagerService.createTokenATMConfiguration(this.course, suffix, description);
        this.onResolve(true);
    }

    public set isProcessing(isProcessing: boolean) {
        this._isProcessing = isProcessing;
        if (this.field) this.field.isReadOnly = isProcessing;
    }

    public get isProcessing(): boolean {
        return this._isProcessing;
    }
}
