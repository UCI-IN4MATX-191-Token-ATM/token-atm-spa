import { Component, Inject, TemplateRef, ViewChild } from '@angular/core';
import type { Course } from 'app/data/course';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { CanvasService } from 'app/services/canvas.service';
import { ModalManagerService } from 'app/services/modal-manager.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import { BasicTokenOption } from 'app/token-options/basic-token-option';
import { EarnByModuleTokenOption } from 'app/token-options/earn-by-module-token-option';
import { getUnixTime } from 'date-fns';
import { Base64 } from 'js-base64';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import type { CourseConfigurable } from '../dashboard/dashboard-routing';

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
        @Inject(ModalManagerService) private modalManagerSerivce: ModalManagerService
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
            await this.modalManagerSerivce.createNotificationModal(
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
                {
                    name: 'Earn & Spend Tokens (Test)',
                    id: configuration.nextFreeTokenOptionGroupId,
                    quiz_id: '',
                    description: Base64.encode(String.raw`<p>Students,</p>
            <p>To earn an extra token to be applied to your final exam, please help us try out a new system developed by your fellow UCI students in their ICS capstone course. The purpose of this programming is take make the Token process more automatic - so students don't have to wait for the Head TA to manually process token counts.</p>
            <p>All you need to do is complete this quiz to let their programming (called a Token ATM) know you want to earn a token. You still need to wait for the Head TA to trigger the automatic request processing. To see if your request was approved, look at the Token ATM Log.&nbsp; The Token ATM Log displays your token balance and information about the requests you've made.</p>
            <p>Thanks for helping us test out the Token ATM!</p>`),
                    is_published: true,
                    token_options: []
                },
                configuration.tokenOptionResolver
            );
            await this.configurationManagerService.addNewTokenOptionGroup(basicGroup);
            basicGroup.addTokenOption(
                new BasicTokenOption(basicGroup, {
                    type: 'basic',
                    id: configuration.nextFreeTokenOptionId,
                    name: 'Earn 0.5 test tokens',
                    description: Base64.encode(
                        'The test tokens you obtained by requesting this token option is just for testing purpose and will not influence your real token counts'
                    ),
                    token_balance_change: 0.5
                })
            );
            basicGroup.addTokenOption(
                new BasicTokenOption(basicGroup, {
                    type: 'basic',
                    id: configuration.nextFreeTokenOptionId,
                    name: 'Spend 1 test token',
                    description: Base64.encode(
                        'The test tokens you spent by requesting this token option is just for testing purpose and will not influence your real token counts'
                    ),
                    token_balance_change: -1
                })
            );
            await this.configurationManagerService.updateTokenOptionGroup(basicGroup);
            const moduleGroup = new TokenOptionGroup(
                configuration,
                {
                    name: 'Course Preparation Token (Test)',
                    id: configuration.nextFreeTokenOptionGroupId,
                    quiz_id: '',
                    description: Base64.encode(String.raw`<div id="quiz-instructions" class="user_content enhanced">
            <div class="description user_content teacher-version enhanced">
            <p>Students,</p>
            <p>To earn an extra token to be applied to your final exam, please help us try out a new system developed by your fellow UCI students in their ICS capstone course. The purpose of this programming is take make the Token process more automatic - so students don't have to wait for the Head TA to manually process token counts.</p>
            <p>All you need to do is complete this quiz to let their programming (called a Token ATM) know you want to earn a token. You still need to wait for the Head TA to trigger the automatic request processing. To see if your request was approved, look at the Token ATM Log.&nbsp; The Token ATM Log displays your token balance and information about the requests you've made.</p>
            <p>Thanks for helping us test out the Token ATM!</p>
            </div>
            </div>`),
                    is_published: true,
                    token_options: []
                },
                configuration.tokenOptionResolver
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
            moduleGroup.addTokenOption(
                new EarnByModuleTokenOption(moduleGroup, {
                    type: 'earn-by-module',
                    id: configuration.nextFreeTokenOptionId,
                    name: `Course Preparation Token`,
                    description: Base64.encode(
                        `To get this test token, you need to pass the Course Preparation Module with a score no less than 70% of the total score. The test token you got is just for testing purpose and will not influence your real token counts`
                    ),
                    token_balance_change: 1,
                    module_name: 'Course Preparation (Must pass with 70% or higher to earn 1 TOKEN)',
                    module_id: moduleId,
                    start_time: getUnixTime(new Date()),
                    grade_threshold: 0.7
                })
            );
            await this.configurationManagerService.updateTokenOptionGroup(moduleGroup);
            this.isProcessing = false;
            await this.modalManagerSerivce.createNotificationModal('Testing Configuration Created!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            await this.modalManagerSerivce.createNotificationModal(
                `Error occured when creating test configuration: ${err}`,
                'Error'
            );
            this.isProcessing = false;
        }
    }

    async onDeleteAll(): Promise<void> {
        if (!this.course) return;
        this.isProcessing = true;
        const [modalRef, result] = await this.modalManagerSerivce.createConfirmationModal(
            'Do you really want to delete all Token ATM related content from this course?',
            'Confirmation',
            true
        );
        modalRef.hide();
        if (!result) {
            this.isProcessing = false;
            return;
        }
        try {
            const configuration = await this.configurationManagerService.getTokenATMConfiguration(this.course);
            await this.configurationManagerService.deleteAll(configuration);
            this.isProcessing = false;
            await this.modalManagerSerivce.createNotificationModal('All Token ATM related content are deleted!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            await this.modalManagerSerivce.createNotificationModal(
                `Error occured when deleting Token ATM related content: ${err}\nYou could delete the Token ATM content manually by deleting two pages prefixed with Token ATM, one assignment group prefixed with Token ATM, and one module prefixed with Token ATM. Sorry for the inconvenience!`,
                'Error'
            );
            this.isProcessing = false;
        }
    }

    onInputModuleName(): void {
        if (!this.moduleNameModalRef || !this.moduleNamePromiseResolve) return;
        this.moduleNameModalRef.hide();
        this.moduleNamePromiseResolve();
    }
}
