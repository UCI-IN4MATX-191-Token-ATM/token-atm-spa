import { Component, Inject } from '@angular/core';
import type { Course } from 'app/data/course';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { CanvasService } from 'app/services/canvas.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { BasicTokenOptionData } from 'app/token-options/basic-token-option';
import { TokenOptionResolverRegistry } from 'app/token-option-resolvers/token-option-resolver-registry';
import {
    WithdrawAssignmentResubmissionTokenOption,
    WithdrawAssignmentResubmissionTokenOptionDataDef,
    type WithdrawAssignmentResubmissionTokenOptionData
} from 'app/token-options/withdraw-assignment-resubmission-token-option';

@Component({
    selector: 'app-dev-test',
    templateUrl: './dev-test.component.html',
    styleUrls: ['./dev-test.component.sass']
})
export class DevTestComponent {
    course?: Course;

    constructor(
        @Inject(TokenATMConfigurationManagerService) private manager: TokenATMConfigurationManagerService,
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(TokenOptionResolverRegistry) private tokenOptionResolverRegistry: TokenOptionResolverRegistry
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
        if (!group) throw new Error('No token option groups exist in the configuration!');
        const basicTokenOptionData: BasicTokenOptionData = {
            type: 'basic',
            id: configuration.nextFreeTokenOptionId,
            name: `Test Token Option ${group.tokenOptions.length}`,
            description: `Just a test <b>token option</b> ${group.tokenOptions.length}`,
            tokenBalanceChange: group.tokenOptions.length,
            isMigrating: false
        };
        group.addTokenOption(this.tokenOptionResolverRegistry.constructTokenOption(group, basicTokenOptionData));
        const result = await this.manager.updateTokenOptionGroup(group);
        console.log('Add token option finished!');
        if (!result) console.log('auto update failed. Need manual update');
    }

    async onDeleteFirstTokenOptionGroup(): Promise<void> {
        if (!this.course) return;
        const configuration = await this.manager.getTokenATMConfiguration(this.course);
        if (!configuration.tokenOptionGroups[0]) throw new Error('No token option groups exist in the configuration!');
        await this.manager.deleteTokenOptionGroup(configuration.tokenOptionGroups[0]);
        console.log('Delete first token option group finished!');
    }

    async onDeleteFirstTokenOption(): Promise<void> {
        if (!this.course) return;
        const configuration = await this.manager.getTokenATMConfiguration(this.course);
        const group = configuration.tokenOptionGroups[0];
        if (!group) throw new Error('No token option groups exist in the configuration!');
        if (!group.tokenOptions[0]) throw new Error('No token option exists in the first token option group!');
        group.deleteTokenOption(group.tokenOptions[0]);
        const result = await this.manager.updateTokenOptionGroup(group);
        console.log('Delete first token option finished!');
        if (!result) console.log('auto update failed. Need manual update');
    }

    async onChangeLastTokenOptionGroupPublishState(): Promise<void> {
        if (!this.course) return;
        const configuration = await this.manager.getTokenATMConfiguration(this.course);
        const group = configuration.tokenOptionGroups[configuration.tokenOptionGroups.length - 1];
        if (!group) throw new Error('No token option groups exist in the configuration!');
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
            await this.canvasService.gradeSubmission(this.course.id, student.id, configuration.logAssignmentId, 0);
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
        const withrdawTokenOptionData: WithdrawAssignmentResubmissionTokenOptionData = {
            type: 'withdraw-assignment-resubmission',
            id: -2,
            name: 'Test Option',
            description: 'AAAAAAAAAA',
            tokenBalanceChange: 10,
            isMigrating: false,
            withdrawTokenOptionId: -3
        };
        const tokenOption = Object.assign(new WithdrawAssignmentResubmissionTokenOption(), withrdawTokenOptionData);
        console.log(tokenOption);
        console.log(WithdrawAssignmentResubmissionTokenOptionDataDef.is(tokenOption));
        console.log(WithdrawAssignmentResubmissionTokenOptionDataDef.encode(tokenOption));
    }
}
