import { Inject, Injectable } from '@angular/core';
import type { Course } from 'app/data/course';
import { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { DescriptionTransformer } from 'app/instruction-generators/description-transformer';
import { EndTimeTransformer } from 'app/instruction-generators/end-time-transformer';
import { HTMLTableGenerator } from 'app/instruction-generators/html-table-generator';
import { NameTransformer } from 'app/instruction-generators/name-transformer';
import { StartTimeTransformer } from 'app/instruction-generators/start-time-transformer';
import { TokenBalanceChangeTransformer } from 'app/instruction-generators/token-balance-change-transformer';
import { MultipleChoiceQuestion } from 'app/quiz-questions/multiple-choice-question';
import { TokenOptionResolverRegistry } from 'app/token-option-resolvers/token-option-resolver-registry';
import { CanvasService } from './canvas.service';
import HTMLParse from 'html-dom-parser';
import { NewDueTimeTransformer } from 'app/instruction-generators/new-due-time-transformer';
import { generateRandomString } from 'app/utils/random-string-generator';

@Injectable({
    providedIn: 'root'
})
export class TokenATMConfigurationManagerService {
    private static TOKEN_ATM_CONFIGURATION_PAGE_NAME = 'Token ATM Configuration';
    private static TOKEN_ATM_SECURE_CONFIGURATION_PAGE_NAME = 'Token ATM Encryption Key (PLEASE DO NOT PUBLISH IT)'; // TODO: Remove 'IT', and maybe 'PLEASE'
    private static TOKEN_ATM_AVAILABLE_TOKEN_OPTIONS_PAGE_NAME = 'Token ATM - Available Token Options';
    private static TOKEN_ATM_ASSIGNMENT_GROUP_PREFIX = 'Token ATM';
    private static TOKEN_ATM_MODULE_PREFIX = 'Token ATM';
    private static TOKEN_ATM_QUIZ_PREFIX = 'Token ATM Request Submission - ';
    private static TOKEN_ATM_LOG_ASSIGNMENT_NAME = 'Token ATM Log';

    constructor(
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(TokenOptionResolverRegistry) private tokenOptionResolverRegistry: TokenOptionResolverRegistry
    ) {}

    private resolvePageContent(rawData: string): string {
        const data = HTMLParse(rawData);
        for (const entry of data) {
            if (entry.type != 'tag' || entry.name != 'p') continue;
            if (entry.children[0]?.type != 'text') continue;
            if (typeof entry.children[0]?.data != 'string') continue;
            return entry.children[0]?.data;
        }
        throw new Error('Page resolve failed');
    }

    private async readConfigurationFromPage(course: Course, pageName: string): Promise<string> {
        let pageContent = await this.canvasService.getPageContentByName(course.id, pageName);
        pageContent = this.resolvePageContent(pageContent);
        return pageContent;
    }

    private async writeConfigurationToPage(course: Course, pageId: string, pageContent: string): Promise<void> {
        await this.canvasService.modifyPage(course.id, pageId, `<p>${pageContent}</p>`);
    }

    private async saveConfiguration(configuration: TokenATMConfiguration): Promise<void> {
        const pageId = await this.canvasService.getPageIdByName(
            configuration.course.id,
            TokenATMConfigurationManagerService.TOKEN_ATM_CONFIGURATION_PAGE_NAME
        );
        await this.writeConfigurationToPage(configuration.course, pageId, JSON.stringify(configuration));
    }

    private async getTokenATMAssignmentGroupId(configuration: TokenATMConfiguration): Promise<string> {
        return await this.canvasService.getAssignmentGroupIdByName(
            configuration.course.id,
            TokenATMConfigurationManagerService.TOKEN_ATM_ASSIGNMENT_GROUP_PREFIX +
                ` - ${configuration.uid} - ${configuration.suffix}`
        );
    }

    private async getTokenATMModuleId(configuration: TokenATMConfiguration): Promise<string> {
        return await this.canvasService.getModuleIdByName(
            configuration.course.id,
            TokenATMConfigurationManagerService.TOKEN_ATM_MODULE_PREFIX +
                ` - ${configuration.uid} - ${configuration.suffix}`
        );
    }

    public async getTokenATMConfiguration(course: Course): Promise<TokenATMConfiguration> {
        const pageContent = await this.readConfigurationFromPage(
            course,
            TokenATMConfigurationManagerService.TOKEN_ATM_CONFIGURATION_PAGE_NAME
        );
        const secureContent = await this.readConfigurationFromPage(
            course,
            TokenATMConfigurationManagerService.TOKEN_ATM_SECURE_CONFIGURATION_PAGE_NAME
        );
        const config = JSON.parse(pageContent),
            secureConfig = JSON.parse(secureContent);
        return TokenATMConfiguration.deserialize(course, config, secureConfig, (group, data) => {
            return this.tokenOptionResolverRegistry.resolveTokenOption(group, data);
        });
    }

    public async updateTokenOptionGroupMetadata(tokenOptionGroup: TokenOptionGroup): Promise<void> {
        const courseId = tokenOptionGroup.configuration.course.id,
            quizId = tokenOptionGroup.quizId;
        await this.canvasService.modifyQuiz(
            courseId,
            quizId,
            TokenATMConfigurationManagerService.TOKEN_ATM_QUIZ_PREFIX + tokenOptionGroup.name,
            String.raw`<div>${tokenOptionGroup.description}</div><div>${this.generateTokenOptionDataTable(
                tokenOptionGroup
            )}</div>`
        );
        await this.saveConfiguration(tokenOptionGroup.configuration);
    }

    private generateTokenOptionDataTable(tokenOptionGroup: TokenOptionGroup): string {
        return new HTMLTableGenerator([
            new NameTransformer(),
            new StartTimeTransformer(),
            new EndTimeTransformer(),
            new NewDueTimeTransformer(),
            new TokenBalanceChangeTransformer(),
            new DescriptionTransformer()
        ]).process(tokenOptionGroup.availableTokenOptions);
    }

    private generateTokenOptionDataPage(configuration: TokenATMConfiguration): string {
        const result = [];
        for (const group of configuration.tokenOptionGroups) {
            if (!group.isPublished) continue;
            result.push('<div>');
            result.push(`<h3>${group.name}</h3>`);
            const tableContent = this.generateTokenOptionDataTable(group);
            if (tableContent.trim() == '') {
                result.push('<p>No available token option exists in this group</p>');
            } else {
                result.push(this.generateTokenOptionDataTable(group));
            }
            result.push('</div>');
        }
        return result.join('');
    }

    private async updateAvailableTokenOptionPage(configuration: TokenATMConfiguration): Promise<void> {
        await this.canvasService.createOrModifyPageByName(
            configuration.course.id,
            TokenATMConfigurationManagerService.TOKEN_ATM_AVAILABLE_TOKEN_OPTIONS_PAGE_NAME,
            this.generateTokenOptionDataPage(configuration)
        );
    }

    public async updateTokenOptionGroup(tokenOptionGroup: TokenOptionGroup): Promise<boolean> {
        const courseId = tokenOptionGroup.configuration.course.id,
            quizId = tokenOptionGroup.quizId;
        let canUnpublish = false;
        if (tokenOptionGroup.isPublished) canUnpublish = await this.canvasService.canQuizUnpublished(courseId, quizId);
        if (tokenOptionGroup.isPublished && canUnpublish)
            canUnpublish = await this.canvasService.changeQuizPublishState(courseId, quizId, false);
        // await this.canvasService.clearQuizQuestions(courseId, quizId);
        const dataTable = this.generateTokenOptionDataTable(tokenOptionGroup);
        await this.canvasService.modifyQuiz(
            courseId,
            quizId,
            TokenATMConfigurationManagerService.TOKEN_ATM_QUIZ_PREFIX + tokenOptionGroup.name,
            String.raw`<div>${tokenOptionGroup.description}</div><div>${dataTable}</div>`
        );
        const question = new MultipleChoiceQuestion(
            'Choose a token option',
            'Make a request by choosing an option below (see the table above for the detailed description of each option)',
            0,
            tokenOptionGroup.availableTokenOptions.map((tokenOption) => tokenOption.prompt)
        );
        // await this.canvasService.createQuizQuestions(courseId, quizId, [question]);
        await this.canvasService.replaceQuizQuestions(courseId, quizId, [question]);

        // TODO: support rendering multiple quiz questions
        await this.updateAvailableTokenOptionPage(tokenOptionGroup.configuration);
        await this.saveConfiguration(tokenOptionGroup.configuration);
        if (tokenOptionGroup.isPublished && canUnpublish)
            await this.canvasService.changeQuizPublishState(courseId, quizId, true);
        return !tokenOptionGroup.isPublished || canUnpublish;
    }

    public async addNewTokenOptionGroup(
        tokenOptionGroup: TokenOptionGroup,
        assignmentGroupId?: string,
        moduleId?: string,
        addToConfiguration = true
    ): Promise<void> {
        if (addToConfiguration) tokenOptionGroup.configuration.addTokenOptionGroup(tokenOptionGroup);
        const courseId = tokenOptionGroup.configuration.course.id;
        if (assignmentGroupId == undefined)
            assignmentGroupId = await this.getTokenATMAssignmentGroupId(tokenOptionGroup.configuration);
        const quizName = TokenATMConfigurationManagerService.TOKEN_ATM_QUIZ_PREFIX + tokenOptionGroup.name;
        const quizId = await this.canvasService.createQuiz(
            courseId,
            assignmentGroupId,
            quizName,
            String.raw`<div>${tokenOptionGroup.description}</div><div>${this.generateTokenOptionDataTable(
                tokenOptionGroup
            )}</div>`
        );
        tokenOptionGroup.quizId = quizId;
        if (moduleId == undefined) moduleId = await this.getTokenATMModuleId(tokenOptionGroup.configuration);
        await this.canvasService.addModuleItem(courseId, moduleId, 'Quiz', quizId);
        await this.updateTokenOptionGroup(tokenOptionGroup);
        if (tokenOptionGroup.isPublished) await this.canvasService.changeQuizPublishState(courseId, quizId, true);
    }

    public async deleteTokenOptionGroup(
        tokenOptionGroup: TokenOptionGroup,
        deleteFromConfiguration = true
    ): Promise<void> {
        if (deleteFromConfiguration) tokenOptionGroup.configuration.deleteTokenOptionGroup(tokenOptionGroup);
        await this.canvasService.deleteQuiz(tokenOptionGroup.configuration.course.id, tokenOptionGroup.quizId);
        await this.updateAvailableTokenOptionPage(tokenOptionGroup.configuration);
        if (deleteFromConfiguration) await this.saveConfiguration(tokenOptionGroup.configuration);
    }

    public async publishTokenOptionGroup(tokenOptionGroup: TokenOptionGroup) {
        if (tokenOptionGroup.isPublished) return;
        await this.canvasService.changeQuizPublishState(
            tokenOptionGroup.configuration.course.id,
            tokenOptionGroup.quizId,
            true
        );
        tokenOptionGroup.isPublished = true;
        await this.updateAvailableTokenOptionPage(tokenOptionGroup.configuration);
        await this.saveConfiguration(tokenOptionGroup.configuration);
    }

    public async unpublishTokenOptionGroup(tokenOptionGroup: TokenOptionGroup): Promise<boolean> {
        if (!tokenOptionGroup.isPublished) {
            if (
                !(await this.canvasService.canQuizUnpublished(
                    tokenOptionGroup.configuration.course.id,
                    tokenOptionGroup.quizId
                ))
            )
                return false;
        }
        const result = await this.canvasService.changeQuizPublishState(
            tokenOptionGroup.configuration.course.id,
            tokenOptionGroup.quizId,
            false
        );
        if (!result) return false;
        tokenOptionGroup.isPublished = false;
        await this.updateAvailableTokenOptionPage(tokenOptionGroup.configuration);
        await this.saveConfiguration(tokenOptionGroup.configuration);
        return true;
    }

    public async updateTokenATMMetadata(
        configuration: TokenATMConfiguration,
        { suffix, description }: { suffix?: string; description?: string } = {}
    ): Promise<void> {
        let isModified = false;
        if (suffix != undefined && suffix != configuration.suffix) {
            await this.canvasService.modifyModuleName(
                configuration.course.id,
                await this.getTokenATMModuleId(configuration),
                TokenATMConfigurationManagerService.TOKEN_ATM_MODULE_PREFIX + ` - ${configuration.uid} - ${suffix}`
            );
            await this.canvasService.modifyAssignmentGroupName(
                configuration.course.id,
                await this.getTokenATMAssignmentGroupId(configuration),
                TokenATMConfigurationManagerService.TOKEN_ATM_ASSIGNMENT_GROUP_PREFIX +
                    ` - ${configuration.uid} - ${suffix}`
            );
            configuration.suffix = suffix;
            isModified = true;
        }
        if (description != undefined && description != configuration.description) {
            await this.canvasService.modifyAssignmentDescription(
                configuration.course.id,
                configuration.logAssignmentId,
                description
            );
            configuration.description = description;
            isModified = true;
        }
        if (isModified) {
            await this.saveConfiguration(configuration);
        }
    }

    public async deleteGeneratedContent(configuration: TokenATMConfiguration): Promise<void> {
        await this.canvasService.deleteAssignmentGroup(
            configuration.course.id,
            await this.getTokenATMAssignmentGroupId(configuration)
        );
        await this.canvasService.deleteModule(configuration.course.id, await this.getTokenATMModuleId(configuration));
        try {
            const pageId = await this.canvasService.getPageIdByName(
                configuration.course.id,
                TokenATMConfigurationManagerService.TOKEN_ATM_AVAILABLE_TOKEN_OPTIONS_PAGE_NAME
            );
            await this.canvasService.deletePage(configuration.course.id, pageId);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            if (err.message != 'Page not found') throw err;
        }
        await this.canvasService.deletePage(
            configuration.course.id,
            await this.canvasService.getPageIdByName(
                configuration.course.id,
                TokenATMConfigurationManagerService.TOKEN_ATM_SECURE_CONFIGURATION_PAGE_NAME
            )
        );
    }

    public async generateContent(configuration: TokenATMConfiguration) {
        const courseId = configuration.course.id;
        // Generate secure config page
        await this.canvasService.createPage(
            courseId,
            TokenATMConfigurationManagerService.TOKEN_ATM_SECURE_CONFIGURATION_PAGE_NAME,
            `<p>${JSON.stringify(configuration.getSecureConfig())}</p>`
        );
        await this.updateAvailableTokenOptionPage(configuration);

        // Generate module & assignment group
        const assignmentGroupId = await this.canvasService.createAssignmentGroup(
            courseId,
            TokenATMConfigurationManagerService.TOKEN_ATM_ASSIGNMENT_GROUP_PREFIX +
                ` - ${configuration.uid} - ${configuration.suffix}`
        );
        const moduleId = await this.canvasService.createModule(
            courseId,
            TokenATMConfigurationManagerService.TOKEN_ATM_MODULE_PREFIX +
                ` - ${configuration.uid} - ${configuration.suffix}`
        );
        await this.canvasService.publishModule(courseId, moduleId);

        // Generate log assignment
        const logAssignmentId = await this.canvasService.createAssignment(
            courseId,
            assignmentGroupId,
            TokenATMConfigurationManagerService.TOKEN_ATM_LOG_ASSIGNMENT_NAME,
            configuration.description
        );
        await this.canvasService.addModuleItem(courseId, moduleId, 'Assignment', logAssignmentId);
        configuration.logAssignmentId = logAssignmentId;

        // Generate token option groups' quizzes
        for (const tokenOptionGroup of configuration.tokenOptionGroups) {
            await this.addNewTokenOptionGroup(tokenOptionGroup, assignmentGroupId, moduleId, false);
        }
        await this.saveConfiguration(configuration);
    }

    public async deleteAll(configuration: TokenATMConfiguration): Promise<void> {
        await this.deleteGeneratedContent(configuration);
        await this.canvasService.deletePage(
            configuration.course.id,
            await this.canvasService.getPageIdByName(
                configuration.course.id,
                TokenATMConfigurationManagerService.TOKEN_ATM_CONFIGURATION_PAGE_NAME
            )
        );
    }

    public async createTokenATMConfiguration(
        course: Course,
        suffix = '',
        description = ''
    ): Promise<TokenATMConfiguration> {
        const configuration = new TokenATMConfiguration(
            course,
            '',
            generateRandomString(8).toUpperCase(),
            suffix,
            description,
            1,
            1,
            [],
            (group, data) => {
                return this.tokenOptionResolverRegistry.resolveTokenOption(group, data);
            },
            generateRandomString(32),
            window.crypto.getRandomValues(new Uint8Array(32))
        );
        await this.canvasService.createPage(
            course.id,
            TokenATMConfigurationManagerService.TOKEN_ATM_CONFIGURATION_PAGE_NAME,
            `<p>${JSON.stringify(configuration)}</p>`
        );
        await this.generateContent(configuration);
        return configuration;
    }

    public async regenerateContent(configuration: TokenATMConfiguration, isMigrating = false): Promise<void> {
        await this.deleteGeneratedContent(configuration);
        configuration.uid = generateRandomString(8).toUpperCase();
        configuration.regenerateSecureConfig();
        if (isMigrating)
            for (const tokenOptionGroup of configuration.tokenOptionGroups) {
                tokenOptionGroup.isPublished = false;
                for (const tokenOption of tokenOptionGroup.tokenOptions) {
                    tokenOption.isMigrating = true;
                }
            }
        await this.generateContent(configuration);
    }

    // TODO: support reordering of token option groups and token options
}
