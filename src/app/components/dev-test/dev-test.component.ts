import { Component, Inject } from '@angular/core';
import type { Course } from 'app/data/course';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import { BasicTokenOption } from 'app/token-options/basic-token-option';

@Component({
    selector: 'app-dev-test',
    templateUrl: './dev-test.component.html',
    styleUrls: ['./dev-test.component.sass']
})
export class DevTestComponent {
    course?: Course;

    constructor(@Inject(TokenATMConfigurationManagerService) private manager: TokenATMConfigurationManagerService) {}

    async configureCourse(course: Course): Promise<void> {
        this.course = course;
    }

    async onRegenerateContent(): Promise<void> {
        if (!this.course) return;
        await this.manager.regenrateContent(await this.manager.getTokenATMConfiguration(this.course));
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
                    id: configuration.getFreeTokenOptionGroupId(),
                    quiz_id: '',
                    description: `Just a test <b>token option group</b> ${configuration.tokenOptionGroups.length}`,
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
                id: configuration.getFreeTokenOptionId(),
                name: `Test Token Option ${group.tokenOptions.length}`,
                description: `Just a test <b>token option</b> ${group.tokenOptions.length}`,
                token_balance_change: group.tokenOptions.length
            })
        );
        const result = await this.manager.updateTokenOptionGroup(group);
        console.log('Add token option finished!');
        if (!result) console.log('unpublish failed. Need manual update');
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
        if (!result) console.log('unpublish failed. Need manual update');
    }
}
