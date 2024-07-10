import { Component, Inject, type TemplateRef, ViewChild } from '@angular/core';
import type { Course } from 'app/data/course';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { CanvasService } from 'app/services/canvas.service';
import { ModalManagerService } from 'app/services/modal-manager.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { BasicTokenOptionData } from 'app/token-options/basic/basic-token-option';
import type { EarnByModuleTokenOptionData } from 'app/token-options/earn-by-module/earn-by-module-token-option';
import { type BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';
import { ErrorSerializer } from 'app/utils/error-serailizer';
import { EditConfigurationModalComponent } from '../edit-configuration-modal/edit-configuration-modal.component';
import { TokenOptionResolverRegistry } from 'app/token-options/token-option-resolver-registry';
import { actionNeededTemplate, tokenATMContentListTemplate } from 'app/utils/string-templates';
import { Router } from '@angular/router';

@Component({
    selector: 'app-configuration',
    templateUrl: './configuration.component.html',
    styleUrls: ['./configuration.component.sass']
})
export class ConfigurationComponent implements CourseConfigurable {
    isProcessing = false;
    course?: Course;

    @ViewChild('moduleNameModal') moduleNameModalTemplate?: TemplateRef<unknown>;
    moduleNameModalRef?: BsModalRef<unknown>;
    moduleNamePromiseResolve?: () => void;
    moduleName?: string;

    constructor(
        @Inject(TokenATMConfigurationManagerService)
        private configurationManagerService: TokenATMConfigurationManagerService,
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(BsModalService) private modalSerivce: BsModalService,
        @Inject(TokenOptionResolverRegistry) private tokenOptionResolverRegistry: TokenOptionResolverRegistry,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService,
        @Inject(Router) private router: Router
    ) {}

    async configureCourse(course: Course): Promise<void> {
        this.course = course;
    }

    async onCreateTestingConfiguration(): Promise<void> {
        if (!this.course) return;
        this.isProcessing = true;
        try {
            await this.canvasService.getPageIdByName(this.course.id, 'Token ATM Configuration');
            this.isProcessing = false;
            await this.modalManagerService.createNotificationModal(
                `There is an existing configuration for this course.`
            );
            return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            // no configuration is there
        }
        try {
            const configuration = await this.configurationManagerService.createTokenATMConfiguration(
                this.course,
                '(Complete to earn 1 TOKEN)',
                'This is just a test generation of the content' // TODO: explanation?
            );
            const basicGroup = new TokenOptionGroup(
                configuration,
                'Earn & Spend Tokens (Test)',
                configuration.nextFreeTokenOptionGroupId,
                '',
                String.raw`<p>Students,</p>
            <p>To earn an extra token to be applied to your final exam, please help us try out a new system developed by your fellow UCI students in their ICS capstone course. The purpose of this programming is take make the Token process more automatic - so students don't have to wait for the Head TA to manually process token counts.</p>
            <p>All you need to do is complete this quiz to let their programming (called a Token ATM) know you want to earn a token. You still need to wait for the Head TA to trigger the automatic request processing. To see if your request was approved, look at the Token ATM Log.&nbsp; The Token ATM Log displays your token balance and information about the requests you've made.</p>
            <p>Thanks for helping us test out the Token ATM!</p>`,
                true,
                []
            );
            await this.configurationManagerService.addNewTokenOptionGroup(basicGroup);
            const basicTokenOption1Data: BasicTokenOptionData = {
                type: 'basic',
                id: configuration.nextFreeTokenOptionId,
                name: 'Earn 0.5 test tokens',
                description:
                    'The test tokens you obtained by requesting this token option is just for testing purpose and will not influence your real token counts',
                tokenBalanceChange: 0.5,
                isMigrating: false
            };
            const basicTokenOption2Data: BasicTokenOptionData = {
                type: 'basic',
                id: configuration.nextFreeTokenOptionId,
                name: 'Spend 1 test token',
                description:
                    'The test tokens you spent by requesting this token option is just for testing purpose and will not influence your real token counts',
                tokenBalanceChange: -1,
                isMigrating: false
            };
            basicGroup.addTokenOption(
                this.tokenOptionResolverRegistry.constructTokenOption(basicGroup, basicTokenOption1Data)
            );
            basicGroup.addTokenOption(
                this.tokenOptionResolverRegistry.constructTokenOption(basicGroup, basicTokenOption2Data)
            );
            await this.configurationManagerService.updateTokenOptionGroup(basicGroup);
            const moduleGroup = new TokenOptionGroup(
                configuration,
                'Course Preparation Token (Test)',
                configuration.nextFreeTokenOptionGroupId,
                '',
                String.raw`<div id="quiz-instructions" class="user_content enhanced">
            <div class="description user_content teacher-version enhanced">
            <p>Students,</p>
            <p>To earn an extra token to be applied to your final exam, please help us try out a new system developed by your fellow UCI students in their ICS capstone course. The purpose of this programming is take make the Token process more automatic - so students don't have to wait for the Head TA to manually process token counts.</p>
            <p>All you need to do is complete this quiz to let their programming (called a Token ATM) know you want to earn a token. You still need to wait for the Head TA to trigger the automatic request processing. To see if your request was approved, look at the Token ATM Log.&nbsp; The Token ATM Log displays your token balance and information about the requests you've made.</p>
            <p>Thanks for helping us test out the Token ATM!</p>
            </div>
            </div>`,
                true,
                []
            );
            await this.configurationManagerService.addNewTokenOptionGroup(moduleGroup);
            this.moduleName = 'Course Preparation (Must pass with 70% or higher to earn 1 TOKEN)';
            this.moduleNameModalRef = this.modalSerivce.show(this.moduleNameModalTemplate as TemplateRef<unknown>, {
                backdrop: 'static',
                keyboard: false
            });
            const moduleNamePromise = new Promise<void>((resolve) => {
                this.moduleNamePromiseResolve = resolve;
            });
            await moduleNamePromise;
            const moduleId = await this.canvasService.getModuleIdByName(this.course.id, this.moduleName as string);
            const moduleTokenOptionData: EarnByModuleTokenOptionData = {
                type: 'earn-by-module',
                id: configuration.nextFreeTokenOptionId,
                name: `Course Preparation Token`,
                description: `To get this test token, you need to pass the Course Preparation Module with a score no less than 70% of the total score. The test token you got is just for testing purpose and will not influence your real token counts`,
                tokenBalanceChange: 1,
                isMigrating: false,
                moduleName: this.moduleName as string,
                moduleId,
                startTime: new Date(),
                gradeThreshold: 0.7
            };
            moduleGroup.addTokenOption(
                this.tokenOptionResolverRegistry.constructTokenOption(moduleGroup, moduleTokenOptionData)
            );
            await this.configurationManagerService.updateTokenOptionGroup(moduleGroup);
            this.isProcessing = false;
            await this.modalManagerService.createNotificationModal('Testing Configuration Created!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            await this.modalManagerService.createNotificationModal(
                `Error occurred when creating test configuration: ${ErrorSerializer.serailize(err)}`,
                'Error'
            );
            this.isProcessing = false;
        }
    }

    async onDeleteAll(): Promise<void> {
        if (!this.course) return;
        this.isProcessing = true;
        const [modalRef, result] = await this.modalManagerService.createConfirmationModal(
            'Do you really want to delete all Token ATM related content from this course?',
            'Confirmation',
            true
        );
        if (!result) {
            this.isProcessing = false;
            modalRef.hide();
            return;
        }
        if (modalRef.content) modalRef.content.disableButton = true;
        try {
            const configuration = await this.configurationManagerService.getTokenATMConfiguration(this.course);
            await this.configurationManagerService.deleteAll(configuration);
            this.isProcessing = false;
            await this.modalManagerService.createNotificationModal('All Token ATM related content has been deleted!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            await this.modalManagerService.createNotificationModal(
                `Error occurred while deleting Token ATM related content for ${
                    this.course.name
                }: ${actionNeededTemplate(
                    `You can use Canvas to delete the Token ATM content by manually deleting: \n${tokenATMContentListTemplate(
                        'the',
                        '\n'
                    )}`
                )}\nNote: You will be redirected to the course selection page after closing this notification.\n\nError Message: ${ErrorSerializer.serailize(
                    err
                )}`,
                'Error'
            );
        } finally {
            this.isProcessing = false;
            modalRef.hide();
        }
        this.router.navigate(['/select-course']);
    }

    async onResetContent(): Promise<void> {
        if (!this.course) return;
        this.isProcessing = true;
        const [modalRef, result] = await this.modalManagerService.createConfirmationModal(
            'Do you really want to reset Token ATM for this course? \n\nThis will cause all information about token balances and requests to be deleted! \n\nNOTE: if any errors occur during a reset, there is NO WAY to recover from them! \n\nAs a precaution, please export the course content before resetting.',
            'Confirmation',
            true
        );
        if (!result) {
            this.isProcessing = false;
            modalRef.hide();
            return;
        }
        if (modalRef.content) modalRef.content.disableButton = true;
        try {
            const configuration = await this.configurationManagerService.getTokenATMConfiguration(this.course);
            await this.configurationManagerService.regenerateContent(configuration);
            await this.modalManagerService.createNotificationModal('Token ATM has been reset!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            await this.modalManagerService.createNotificationModal(
                `Error occurred while resetting Token ATM:${actionNeededTemplate(
                    `Please use Canvas to remove the Token ATM content by manually deleting: \n${tokenATMContentListTemplate(
                        'the',
                        '\n'
                    )}\n\nAfter that, use the course export you made before resetting to reimport the Token ATM course content (${tokenATMContentListTemplate(
                        'the',
                        ' ',
                        true
                    )} you just deleted). \n\nAfter importing from a backup, perform a Token ATM migration.`
                )}\n\nError Message: ${ErrorSerializer.serailize(err)}`
            );
        } finally {
            this.isProcessing = false;
            modalRef.hide();
        }
    }

    async onMigrate(): Promise<void> {
        if (!this.course) return;
        this.isProcessing = true;
        const [modalRef, result] = await this.modalManagerService.createConfirmationModal(
            'Do you really want to start the migration of Token ATM for this course? \n\nThis will cause all information about token balances and requests to be deleted! \n\nAlso, all token option groups will be unpublished, and all token options will need to be saved again to complete the migration. \n\nNOTE: if any errors occur during migration, there is NO WAY to recover from them! \n\nAs a precaution, please export the course content before migrating.',
            'Confirmation',
            true
        );
        if (!result) {
            this.isProcessing = false;
            modalRef.hide();
            return;
        }
        if (modalRef.content) modalRef.content.disableButton = true;
        try {
            const configuration = await this.configurationManagerService.getTokenATMConfiguration(this.course);
            await this.configurationManagerService.regenerateContent(configuration, true);
            await this.modalManagerService.createNotificationModal(
                'Token ATM migration has started! \n\nYou need to manually save every token option again to complete the migration.'
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            await this.modalManagerService.createNotificationModal(
                `Error occurred when migrating Token ATM:${actionNeededTemplate(
                    `Please use Canvas to delete the Token ATM content by manually deleting: \n${tokenATMContentListTemplate(
                        'the',
                        '\n'
                    )} \n\nAfter that, use the course export you made before migrating to reimport the Token ATM course content (${tokenATMContentListTemplate(
                        'the',
                        ' ',
                        true
                    )} you just deleted). \n\nAfter importing from a backup, try the migration again.`
                )}\n\nError Message: ${ErrorSerializer.serailize(err)}`
            );
        } finally {
            this.isProcessing = false;
            modalRef.hide();
        }
    }

    onInputModuleName(): void {
        if (!this.moduleNameModalRef || !this.moduleNamePromiseResolve) return;
        this.moduleNameModalRef.hide();
        this.moduleNamePromiseResolve();
    }

    async onEditConfigurationMetadata(): Promise<void> {
        if (!this.course) return;
        this.isProcessing = true;
        const modalRef = this.modalSerivce.show(EditConfigurationModalComponent, {
            initialState: {
                configuration: await this.configurationManagerService.getTokenATMConfiguration(this.course)
            },
            backdrop: 'static',
            keyboard: false
        });
        if (modalRef.content) modalRef.content.modalRef = modalRef;
        this.isProcessing = false;
    }
}
