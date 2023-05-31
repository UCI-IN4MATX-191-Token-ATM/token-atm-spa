import { Component, Inject } from '@angular/core';
import type { Course } from 'app/data/course';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { CanvasService } from 'app/services/canvas.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import { BasicTokenOption } from 'app/token-options/basic-token-option';
import { EarnByModuleTokenOption } from 'app/token-options/earn-by-module-token-option';
import { getUnixTime } from 'date-fns';
import { Base64 } from 'js-base64';

@Component({
    selector: 'app-dev-test',
    templateUrl: './dev-test.component.html',
    styleUrls: ['./dev-test.component.sass']
})
export class DevTestComponent {
    course?: Course;

    constructor(
        @Inject(TokenATMConfigurationManagerService) private manager: TokenATMConfigurationManagerService,
        @Inject(CanvasService) private canvasService: CanvasService
    ) {}

    async configureCourse(course: Course): Promise<void> {
        this.course = course;
    }

    async onRegenerateContent(): Promise<void> {
        if (!this.course) return;
        await this.manager.regenerateContent(await this.manager.getTokenATMConfiguration(this.course));
        console.log('Regeneration finished!');
    }

    async onDeleteAll(): Promise<void> {
        if (!this.course) return;
        await this.manager.deleteAll(await this.manager.getTokenATMConfiguration(this.course));
        console.log('Delete all finished!');
    }

    async onCreateConfiguration(): Promise<void> {
        if (!this.course) return;
        const configuration = await this.manager.createTokenATMConfiguration(
            this.course,
            'Just Testing',
            'This is just a test generation of the content'
        );
        console.log('Configuration created', configuration);
    }

    async onAddTokenOptionGroup(): Promise<void> {
        if (!this.course) return;
        const configuration = await this.manager.getTokenATMConfiguration(this.course);
        await this.manager.addNewTokenOptionGroup(
            new TokenOptionGroup(
                configuration,
                {
                    name: 'Test Token Option Group ' + configuration.tokenOptionGroups.length.toString(),
                    id: configuration.nextFreeTokenOptionGroupId,
                    quiz_id: '',
                    description: Base64.encode(
                        `Just a test <b>token option group</b> ${configuration.tokenOptionGroups.length}`
                    ),
                    is_published: false,
                    token_options: []
                },
                configuration.tokenOptionResolver
            )
        );
        console.log('Add token option group finished');
    }

    async onAddTokenOption(): Promise<void> {
        if (!this.course) return;
        const configuration = await this.manager.getTokenATMConfiguration(this.course);
        const group = configuration.tokenOptionGroups[configuration.tokenOptionGroups.length - 1];
        if (!group) throw new Error('No token option group in the configuration!');
        group.addTokenOption(
            new BasicTokenOption(group, {
                type: 'basic',
                id: configuration.nextFreeTokenOptionId,
                name: `Test Token Option ${group.tokenOptions.length}`,
                description: Base64.encode(`Just a test <b>token option</b> ${group.tokenOptions.length}`),
                token_balance_change: group.tokenOptions.length
            })
        );
        const result = await this.manager.updateTokenOptionGroup(group);
        console.log('Add token option finished!');
        if (!result) console.log('auto update failed. Need manual update');
    }

    async onDeleteFirstTokenOptionGroup(): Promise<void> {
        if (!this.course) return;
        const configuration = await this.manager.getTokenATMConfiguration(this.course);
        if (!configuration.tokenOptionGroups[0]) throw new Error('No token option group in the configuration!');
        await this.manager.deleteTokenOptionGroup(configuration.tokenOptionGroups[0]);
        console.log('Delete first token option group finished!');
    }

    async onDeleteFirstTokenOption(): Promise<void> {
        if (!this.course) return;
        const configuration = await this.manager.getTokenATMConfiguration(this.course);
        const group = configuration.tokenOptionGroups[0];
        if (!group) throw new Error('No token option group in the configuration!');
        if (!group.tokenOptions[0]) throw new Error('No token option in the first token option group!');
        group.deleteTokenOption(group.tokenOptions[0]);
        const result = await this.manager.updateTokenOptionGroup(group);
        console.log('Delete first token option finished!');
        if (!result) console.log('auto update failed. Need manual update');
    }

    async onChangeLastTokenOptionGroupPublishState(): Promise<void> {
        if (!this.course) return;
        const configuration = await this.manager.getTokenATMConfiguration(this.course);
        const group = configuration.tokenOptionGroups[configuration.tokenOptionGroups.length - 1];
        if (!group) throw new Error('No token option group in the configuration!');
        if (group.isPublished) {
            const result = await this.manager.unpublishTokenOptionGroup(group);
            console.log('Unpublish operation attempted. Result: ', result);
        } else {
            await this.manager.publishTokenOptionGroup(group);
            console.log('Token option group published!');
        }
    }

    async onResetStudentRecord(): Promise<void> {
        if (!this.course) return;
        const configuration = await this.manager.getTokenATMConfiguration(this.course);
        for await (const student of await this.canvasService.getCourseStudentEnrollments(this.course.id)) {
            this.canvasService.gradeSubmission(this.course.id, student.id, configuration.logAssignmentId, 0);
            for (const submissionComment of await this.canvasService.getSubmissionComments(
                this.course.id,
                student.id,
                configuration.logAssignmentId
            )) {
                await this.canvasService.deleteComment(
                    this.course.id,
                    student.id,
                    configuration.logAssignmentId,
                    submissionComment.id
                );
            }
        }
        console.log('Deletion finished!');
    }

    async onMyOperation(): Promise<void> {
        if (!this.course) return;
        const configuration = await this.manager.getTokenATMConfiguration(this.course);
        const group = new TokenOptionGroup(
            configuration,
            {
                name: 'Pass Module',
                id: configuration.nextFreeTokenOptionGroupId,
                quiz_id: '',
                description: Base64.encode('Pass module with a specific grade threshold to get tokens!'),
                is_published: true,
                token_options: []
            },
            configuration.tokenOptionResolver
        );
        await this.manager.addNewTokenOptionGroup(group);
        group.addTokenOption(
            new EarnByModuleTokenOption(group, {
                type: 'earn-by-module',
                id: configuration.nextFreeTokenOptionId,
                name: `getting tokens by passing module 1`,
                description: Base64.encode(`Passing Module 1 with a score no less than 70% of the total score`),
                token_balance_change: 1,
                module_name: 'Module 1',
                module_id: '12612114',
                start_time: getUnixTime(new Date()),
                grade_threshold: 0.7
            })
        );
        group.addTokenOption(
            new EarnByModuleTokenOption(group, {
                type: 'earn-by-module',
                id: configuration.nextFreeTokenOptionId,
                name: `getting tokens by passing module 2`,
                description: Base64.encode(`Passing Module 1 with a score no less than 80% of the total score`),
                token_balance_change: 2,
                module_name: 'Module 2',
                module_id: '12612167',
                start_time: getUnixTime(new Date()),
                grade_threshold: 0.8
            })
        );
        await this.manager.updateTokenOptionGroup(group);
        const basicGroup = new TokenOptionGroup(
            configuration,
            {
                name: 'Basic Token Options (Testing)',
                id: configuration.nextFreeTokenOptionGroupId,
                quiz_id: '',
                description: Base64.encode(
                    'Test Token ATM with these basic token options whose requests are always get approved!'
                ),
                is_published: true,
                token_options: []
            },
            configuration.tokenOptionResolver
        );
        await this.manager.addNewTokenOptionGroup(basicGroup);
        basicGroup.addTokenOption(
            new BasicTokenOption(group, {
                type: 'basic',
                id: configuration.nextFreeTokenOptionId,
                name: `basic token option 1`,
                description: Base64.encode(`Just a test <b>token option</b>`),
                token_balance_change: 100
            })
        );
        basicGroup.addTokenOption(
            new BasicTokenOption(group, {
                type: 'basic',
                id: configuration.nextFreeTokenOptionId,
                name: `basic token option 2`,
                description: Base64.encode(`Just a test <b>token option</b>`),
                token_balance_change: 0.5
            })
        );
        basicGroup.addTokenOption(
            new BasicTokenOption(group, {
                type: 'basic',
                id: configuration.nextFreeTokenOptionId,
                name: `basic token option 3`,
                description: Base64.encode(`Just a test <b>token option</b>`),
                token_balance_change: -100
            })
        );
        await this.manager.updateTokenOptionGroup(basicGroup);
        console.log('Completed!');
    }
}
