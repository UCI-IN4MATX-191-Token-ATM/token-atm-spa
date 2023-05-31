import { Inject, Injectable } from '@angular/core';
import type { Course } from 'app/data/course';
import { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { DescriptionTransformer } from 'app/instruction-generators/description-transformer';
import { DueTimeTransformer } from 'app/instruction-generators/due-time-transformer';
import { HTMLTableGenerator } from 'app/instruction-generators/html-table-generator';
import { NameTransformer } from 'app/instruction-generators/name-transformer';
import { StartTimeTransformer } from 'app/instruction-generators/start-time-transformer';
import { TokenBalanceChangeTransformer } from 'app/instruction-generators/token-balance-change-transformer';
import { MultipleChoiceQuestion } from 'app/quiz-questions/multiple-choice-question';
import { TokenOptionResolverRegistry } from 'app/token-option-resolvers/token-option-resolver-registry';
import { Base64 } from 'js-base64';
import { CanvasService } from './canvas.service';
import HTMLParse from 'html-dom-parser';

@Injectable({
    providedIn: 'root'
})
export class TokenATMConfigurationManagerService {
    private static TOKEN_ATM_CONFIGURATION_PAGE_NAME = 'Token ATM Configuration';
    private static TOKEN_ATM_SECURE_CONFIGURATION_PAGE_NAME = 'Token ATM Encryption Key (PLEASE DO NOT PUBLISH IT)';
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
        throw new Error('Page resolve fails');
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
        this.writeConfigurationToPage(configuration.course, pageId, JSON.stringify(configuration));
    }

    private async getAssignmentGroupId(configuration: TokenATMConfiguration): Promise<string> {
        return await this.canvasService.getAssignmentGroupIdByName(
            configuration.course.id,
            TokenATMConfigurationManagerService.TOKEN_ATM_ASSIGNMENT_GROUP_PREFIX +
                ` - ${configuration.uid} - ${configuration.suffix}`
        );
    }

    private async getModuleId(configuration: TokenATMConfiguration): Promise<string> {
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
        return new TokenATMConfiguration(course, config, secureConfig, (group, data) => {
            return this.tokenOptionResolverRegistry.resolveTokenOption(group, data);
        });
    }

    public async updateTokenOptionGroup(tokenOptionGroup: TokenOptionGroup): Promise<boolean> {
        const courseId = tokenOptionGroup.configuration.course.id,
            quizId = tokenOptionGroup.quizId;
        let canUnpublish = false;
        if (tokenOptionGroup.isPublished) canUnpublish = await this.canvasService.canQuizUnpublished(courseId, quizId);
        if (tokenOptionGroup.isPublished && canUnpublish)
            canUnpublish = await this.canvasService.changeQuizPublishState(courseId, quizId, false);
        await this.canvasService.clearQuizQuestions(courseId, quizId);
        await this.canvasService.modifyQuiz(
            courseId,
            quizId,
            TokenATMConfigurationManagerService.TOKEN_ATM_QUIZ_PREFIX + tokenOptionGroup.name,
            tokenOptionGroup.description
        );
        const question = new MultipleChoiceQuestion(
            'Choose a token option',
            new HTMLTableGenerator([
                new NameTransformer(),
                new StartTimeTransformer(),
                new DueTimeTransformer(),
                new TokenBalanceChangeTransformer(),
                new DescriptionTransformer()
            ]).process(tokenOptionGroup.tokenOptions),
            0,
            tokenOptionGroup.tokenOptions.map((tokenOption) => tokenOption.prompt)
        );
        await this.canvasService.createQuizQuestions(courseId, quizId, [question]);
        // TODO: support rendering multiple quiz questions
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
            assignmentGroupId = await this.getAssignmentGroupId(tokenOptionGroup.configuration);
        const quizName = TokenATMConfigurationManagerService.TOKEN_ATM_QUIZ_PREFIX + tokenOptionGroup.name;
        const quizId = await this.canvasService.createQuiz(
            courseId,
            assignmentGroupId,
            quizName,
            tokenOptionGroup.description
        );
        tokenOptionGroup.quizId = quizId;
        if (moduleId == undefined) moduleId = await this.getModuleId(tokenOptionGroup.configuration);
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
        await this.saveConfiguration(tokenOptionGroup.configuration);
        return true;
    }

    public async deleteGeneratedContent(configuration: TokenATMConfiguration): Promise<void> {
        await this.canvasService.deleteAssignmentGroup(
            configuration.course.id,
            await this.getAssignmentGroupId(configuration)
        );
        await this.canvasService.deleteModule(configuration.course.id, await this.getModuleId(configuration));
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
            {
                log_assignment_id: '',
                // https://stackoverflow.com/a/47496558
                uid: [...Array(8)]
                    .map(() => Math.random().toString(36)[2])
                    .join('')
                    .toUpperCase(),
                suffix: suffix,
                description: Base64.encode(description),
                next_free_token_option_group_id: 1,
                next_free_token_option_id: 1,
                token_option_groups: []
            },
            {
                password: [...Array(32)].map(() => Math.random().toString(36)[2]).join(''),
                salt: Base64.fromUint8Array(window.crypto.getRandomValues(new Uint8Array(32)))
            },
            (group, data) => {
                return this.tokenOptionResolverRegistry.resolveTokenOption(group, data);
            }
        );
        await this.canvasService.createPage(
            course.id,
            TokenATMConfigurationManagerService.TOKEN_ATM_CONFIGURATION_PAGE_NAME,
            `<p>${JSON.stringify(configuration)}</p>`
        );
        await this.generateContent(configuration);
        return configuration;
    }

    public async regenerateContent(configuration: TokenATMConfiguration): Promise<void> {
        await this.deleteGeneratedContent(configuration);
        await this.generateContent(configuration);
    }

    // TODO: support reordering of token option groups and token options
}
