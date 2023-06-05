import { Component, Inject } from '@angular/core';
import type { Course } from 'app/data/course';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { CanvasService } from 'app/services/canvas.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import { BasicTokenOption } from 'app/token-options/basic-token-option';
import { EarnByModuleTokenOption } from 'app/token-options/earn-by-module-token-option';
import { EarnByQuizTokenOption } from 'app/token-options/earn-by-quiz-token-option';
import { EarnBySurveyTokenOption } from 'app/token-options/earn-by-survey-token-option';
import { SpendForAssignmentResubmissionTokenOption } from 'app/token-options/spend-for-assignment-resubmission-token-option';
import { SpendForLabDataTokenOption } from 'app/token-options/spend-for-lab-data-token-option';
import { addMonths, addYears } from 'date-fns';

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
                'Test Token Option Group ' + configuration.tokenOptionGroups.length.toString(),
                configuration.nextFreeTokenOptionGroupId,
                '',
                `Just a test <b>token option group</b> ${configuration.tokenOptionGroups.length}`,
                false,
                []
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
            new BasicTokenOption(
                group,
                'basic',
                configuration.nextFreeTokenOptionId,
                `Test Token Option ${group.tokenOptions.length}`,
                `Just a test <b>token option</b> ${group.tokenOptions.length}`,
                group.tokenOptions.length
            )
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

    async onPopulateICSExpoConfiguration(): Promise<void> {
        if (!this.course) return;
        const configuration = await this.manager.getTokenATMConfiguration(this.course);
        const group = new TokenOptionGroup(
            configuration,
            'Pass Module',
            configuration.nextFreeTokenOptionGroupId,
            '',
            'Pass module with a specific grade threshold to get tokens!',
            true,
            []
        );
        await this.manager.addNewTokenOptionGroup(group);
        group.addTokenOption(
            new EarnByModuleTokenOption(
                group,
                'earn-by-module',
                configuration.nextFreeTokenOptionId,
                `getting tokens by passing module 1`,
                `Passing Module 1 with a score no less than 70% of the total score`,
                1,
                'Module 1',
                '12612114',
                new Date(),
                0.7
            )
        );
        group.addTokenOption(
            new EarnByModuleTokenOption(
                group,
                'earn-by-module',
                configuration.nextFreeTokenOptionId,
                `getting tokens by passing module 2`,
                `Passing Module 1 with a score no less than 80% of the total score`,
                2,
                'Module 2',
                '12612167',
                new Date(),
                0.8
            )
        );
        await this.manager.updateTokenOptionGroup(group);
        const basicGroup = new TokenOptionGroup(
            configuration,
            'Basic Token Options (Testing)',
            configuration.nextFreeTokenOptionGroupId,
            '',
            'Test Token ATM with these basic token options whose requests are always get approved!',
            true,
            []
        );
        await this.manager.addNewTokenOptionGroup(basicGroup);
        basicGroup.addTokenOption(
            new BasicTokenOption(
                group,
                'basic',
                configuration.nextFreeTokenOptionId,
                `basic token option 1`,
                `Just a test <b>token option</b>`,
                100
            )
        );
        basicGroup.addTokenOption(
            new BasicTokenOption(
                group,
                'basic',
                configuration.nextFreeTokenOptionId,
                `basic token option 2`,
                `Just a test <b>token option</b>`,
                0.5
            )
        );
        basicGroup.addTokenOption(
            new BasicTokenOption(
                group,
                'basic',
                configuration.nextFreeTokenOptionId,
                `basic token option 3`,
                `Just a test <b>token option</b>`,
                -100
            )
        );
        await this.manager.updateTokenOptionGroup(basicGroup);
        console.log('Completed!');
    }

    async onMyOperation(): Promise<void> {
        if (!this.course) return;
        const configuration = await this.manager.getTokenATMConfiguration(this.course);
        const group = new TokenOptionGroup(
            configuration,
            'New Feature Testing',
            configuration.nextFreeTokenOptionGroupId,
            '',
            'Testing new features',
            true,
            []
        );
        await this.manager.addNewTokenOptionGroup(group);
        group.addTokenOption(
            new EarnByQuizTokenOption(
                group,
                'earn-by-quiz',
                configuration.nextFreeTokenOptionId,
                'Earn by Quiz Testing',
                'Just a description',
                10,
                'Argument Driven Inquiry (ADI) Quiz',
                '14478031',
                new Date(),
                0.5
            )
        );
        group.addTokenOption(
            new SpendForAssignmentResubmissionTokenOption(
                group,
                'spend-for-assignment-resubmission',
                configuration.nextFreeTokenOptionId,
                'Spend for Assignment Resubmission Testing',
                'Just a description',
                -1,
                'Test Locked Assignment',
                '38096634',
                new Date(),
                addMonths(new Date(), 1),
                addYears(new Date(), 1)
            )
        );
        group.addTokenOption(
            new SpendForLabDataTokenOption(
                group,
                'spend-for-lab-data',
                configuration.nextFreeTokenOptionId,
                'Spend for Lab Data Testing',
                'Just a description',
                -2,
                'Test Lab Data Quiz',
                '14544887',
                new Date(),
                addMonths(new Date(), 1),
                addYears(new Date(), 1),
                []
            )
        );
        group.addTokenOption(
            new SpendForLabDataTokenOption(
                group,
                'spend-for-lab-data',
                configuration.nextFreeTokenOptionId,
                'Expire Test',
                'Just make it expired',
                -2,
                'Test Lab Data Quiz',
                '14544887',
                new Date(),
                new Date(),
                addYears(new Date(), 1),
                []
            )
        );
        group.addTokenOption(
            new EarnBySurveyTokenOption(
                group,
                'earn-by-survey',
                configuration.nextFreeTokenOptionId,
                'Earn by Taking Qualtrics Survey Testing',
                'Just a description',
                10,
                'SV_aVQu2sEgpSgSkBw',
                'Email',
                new Date(),
                addMonths(new Date(), 1)
            )
        );
        await this.manager.updateTokenOptionGroup(group);
        console.log('Completed!');
    }
}
