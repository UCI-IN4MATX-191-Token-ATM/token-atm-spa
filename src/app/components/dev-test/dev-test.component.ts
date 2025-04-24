import { Component, Inject } from '@angular/core';
import type { Course } from 'app/data/course';
import { TokenOptionGroup } from 'app/data/token-option-group';
import { CanvasService } from 'app/services/canvas.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { BasicTokenOptionData } from 'app/token-options/basic/basic-token-option';
import { TokenOptionResolverRegistry } from 'app/token-options/token-option-resolver-registry';
import {
    WithdrawAssignmentResubmissionTokenOption,
    WithdrawAssignmentResubmissionTokenOptionDataDef,
    type WithdrawAssignmentResubmissionTokenOptionData
} from 'app/token-options/withdraw-assignment-resubmission/withdraw-assignment-resubmission-token-option';
import { QualtricsService } from 'app/services/qualtrics.service';
import formatInTimeZone from 'date-fns-tz/formatInTimeZone';
import { DataConversionHelper } from 'app/utils/data-conversion-helper';
import { Student } from 'app/data/student';
import { Base64 } from 'js-base64';
import { CryptoHelper } from 'app/utils/crypto-helper';
import { StudentRecord } from 'app/data/student-record';
import { StudentRecordManagerService } from 'app/services/student-record-manager.service';

@Component({
    selector: 'app-dev-test',
    templateUrl: './dev-test.component.html',
    styleUrls: ['./dev-test.component.sass']
})
export class DevTestComponent {
    course?: Course;
    qualtricsSurveyId = 'SV_560f6LnM1eF0VdI';
    qualtricsFieldName = 'Email';
    private testPagePublished?: boolean = undefined;
    private testPageId?: string;
    testPageName = 'Token ATM Configuration';
    testAssignmentName = 'Token ATM Log';
    testPassword = '';
    testSalt = '';
    private encryptedCommentsCache: string[] = [];

    constructor(
        @Inject(TokenATMConfigurationManagerService) private manager: TokenATMConfigurationManagerService,
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(TokenOptionResolverRegistry) private tokenOptionResolverRegistry: TokenOptionResolverRegistry,
        @Inject(QualtricsService) private qualtricsService: QualtricsService
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
        const withdrawTokenOptionData: WithdrawAssignmentResubmissionTokenOptionData = {
            type: 'withdraw-assignment-resubmission',
            id: -2,
            name: 'Test Option',
            description: 'AAAAAAAAAA',
            tokenBalanceChange: 10,
            isMigrating: false,
            withdrawTokenOptionId: -3
        };
        const tokenOption = Object.assign(new WithdrawAssignmentResubmissionTokenOption(), withdrawTokenOptionData);
        console.log(tokenOption);
        console.log(WithdrawAssignmentResubmissionTokenOptionDataDef.is(tokenOption));
        console.log(WithdrawAssignmentResubmissionTokenOptionDataDef.encode(tokenOption));
    }

    async timeZoneCheck(): Promise<void> {
        if (!this.course) return;
        const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const match = this.course.timeZone === localTimeZone;
        console.log(
            `Time zones ${match ? '' : 'do not '}match. ${this.course.timeZone} ${match ? '' : '!'}= ${localTimeZone}`
        );
    }

    async timeZoneDisplay(): Promise<void> {
        if (!this.course) return;
        const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const time = Date.now();
        const local = formatInTimeZone(time, localTimeZone, 'MMM dd, yyyy HH:mm:ss');
        if (localTimeZone === this.course.timeZone) {
            console.log('Time:', local);
        } else {
            console.log(
                ` Local: ${local}\n` +
                    `Course: ${formatInTimeZone(time, this.course.timeZone, 'MMM dd, yyyy HH:mm:ss')}`
            );
        }
    }

    async checkQualtricsSurveyExists(): Promise<void> {
        await this.qualtricsService.checkSurveyExists(this.qualtricsSurveyId);
        console.log('No error occurred when looking for', this.qualtricsSurveyId);
    }

    async resetQualtricsSurveyCache(): Promise<void> {
        this.qualtricsService.clearCache();
        console.log('All caches in Qualtrics Service cleared.');
    }

    async checkQualtricsResponseSchema(): Promise<void> {
        console.log('Response Schema:', await this.qualtricsService.getSurveyResponseSchema(this.qualtricsSurveyId));
    }

    async checkForFieldInQualtricsSurvey(): Promise<void> {
        await this.qualtricsService.checkResponseSchemaForField(this.qualtricsSurveyId, this.qualtricsFieldName);
        console.log(
            `No error occurred while looking for field '${this.qualtricsFieldName}' in survey '${this.qualtricsSurveyId}'.`
        );
    }

    async getSurveyFields(): Promise<void> {
        console.log('All Survey Fields:', await this.qualtricsService.getSurveyFieldSchemas(this.qualtricsSurveyId));
    }

    async getConfigurationPageId(): Promise<void> {
        if (!this.course) return;
        this.testPageId = await this.canvasService.getPageIdByName(this.course.id, this.testPageName);
    }

    clearPageId(): void {
        this.testPageId = undefined;
    }

    async isConfigurationPagePublished(text = ''): Promise<void> {
        if (!this.course) return;
        if (!this.testPageId) {
            await this.getConfigurationPageId();
            if (!this.testPageId) return;
        }
        this.testPagePublished = await this.canvasService.isPagePublished(this.course.id, this.testPageId);
        const str = this.testPagePublished ? '' : 'NOT ';
        console.log(`${this.testPageName} Page is ${text}${str}published`);
    }

    async switchConfigurationPagePublishedState(): Promise<void> {
        if (!this.course) return;
        if (!this.testPageId) {
            await this.getConfigurationPageId();
            if (!this.testPageId) return;
        }
        if (this.testPagePublished == null) {
            this.testPagePublished = await this.canvasService.isPagePublished(this.course.id, this.testPageId);
        }
        await this.canvasService.modifyPagePublishedState(this.course.id, this.testPageId, !this.testPagePublished);
        this.isConfigurationPagePublished('now ');
    }

    async isAssignmentPublished(): Promise<void> {
        if (!this.course) return;
        const assignmentId = await this.canvasService.getAssignmentIdByName(this.course.id, this.testAssignmentName);
        const bool = await this.canvasService.isAssignmentPublished(this.course.id, assignmentId);
        console.log(`Canvas Assignment '${this.testAssignmentName}' is ${bool ? '' : 'NOT '}published.`);
    }

    async switchAssignmentPublishedState(): Promise<void> {
        if (!this.course) return;
        const assignmentId = await this.canvasService.getAssignmentIdByName(this.course.id, this.testAssignmentName);
        const bool = await this.canvasService.isAssignmentPublished(this.course.id, assignmentId);
        await this.canvasService.modifyAssignmentPublishedState(this.course.id, assignmentId, !bool);
        console.log(`Canvas Assignment '${this.testAssignmentName}' is now ${!bool ? '' : 'NOT '}published.`);
    }

    async checkAllAssignmentGroupsTotalPointsPossible(): Promise<void> {
        if (!this.course) return;
        console.log('Total Points Possible');
        const skipIf = undefined; // { points_possible: [3, 7, 10] };
        for await (const { id, name } of await this.canvasService.getAssignmentGroups(this.course.id)) {
            console.log(
                `  ${name}:`,
                await this.canvasService.getTotalPointsPossibleInAnAssignmentGroup(this.course.id, id, skipIf)
            );
        }
    }

    async compareUsersAndEnrollments(): Promise<void> {
        if (!this.course) return;
        console.log('_______________________________________________');
        console.log('Canvas Users and Section Enrollment Comparisons');
        function nonSubset<T>(sub: Set<T>, sup: Set<T>): number {
            let count = 0;
            for (const el of sub) {
                if (!sup.has(el)) count++;
            }
            return count;
        }
        function difference<T>(a: Set<T>, b: Set<T>) {
            const result = new Set(a);
            for (const el of b) {
                result.delete(el);
            }
            return result;
        }

        // Active Student Users
        const courseActiveStudentUsers = await DataConversionHelper.convertAsyncIterableToList(
            await this.canvasService.getCourseStudentEnrollments(this.course.id)
        );
        const courseActiveStudentUserIds = new Set<string>(courseActiveStudentUsers.map((s) => s.id));
        if (courseActiveStudentUsers.length !== courseActiveStudentUserIds.size)
            console.log('Warning! Active Student Users do not have unique Ids');

        // Sections and their Students
        const sections = await DataConversionHelper.convertAsyncIterableToList(
            await this.canvasService.getSections(this.course.id)
        );
        const sectionIdStudentsMap = new Map<string, Student[]>();
        for (const section of sections) {
            sectionIdStudentsMap.set(
                section.id,
                await this.canvasService.getSectionStudentsWithEmail(this.course.id, section.id)
            );
        }
        const sectionIdStudentIdsMap = new Map<string, Set<string>>(
            Array.from(sectionIdStudentsMap.entries()).map((entry) => {
                const [k, v] = entry;
                return [k, new Set<string>(v.map((s) => s.id))];
            })
        );
        for (const [sectionId, students] of sectionIdStudentsMap) {
            if (students.length !== sectionIdStudentIdsMap.get(sectionId)?.size) {
                console.log("Warning! A section's Active StudentEnrollments doesn't have unique Ids");
                console.log(
                    `  Section Id: ${sectionId}, Section Name: ${sections
                        .filter((s) => s.id === sectionId)
                        .map((s) => s.name)}`
                );
                // const repeatedIds: string[] = [];
                // const foundIds = new Set<string>();
                // for (const stu of students) {
                //     if (foundIds.has(stu.id)) {
                //         repeatedIds.push(stu.id);
                //     }
                //     foundIds.add(stu.id);
                // }
                // console.log('  Repeated Ids:', repeatedIds);
            }
        }

        // Collate and Compare every Section's StuIds
        const allSectionsStuIds = new Set<string>();
        for (const [sectionId, stuIdSet] of sectionIdStudentIdsMap) {
            for (const id of stuIdSet) {
                allSectionsStuIds.add(id);
            }
            const nonSubsetCount = nonSubset(stuIdSet, courseActiveStudentUserIds);
            if (nonSubsetCount > 0) {
                console.log(
                    'Section Id:',
                    sectionId,
                    'has',
                    nonSubsetCount,
                    'students that are not Active Student Users (Section has Excess Students)'
                );
            }
        }

        const nonSubsetCountAllSections = nonSubset(allSectionsStuIds, courseActiveStudentUserIds);
        console.log(
            'Totalling All Sections, there are',
            nonSubsetCountAllSections,
            'students that are not Active Student Users'
        );
        if (allSectionsStuIds.size !== courseActiveStudentUserIds.size) {
            console.log(
                `  And the total number of unique Active StudentEnrollments (${allSectionsStuIds.size}) in sections does not match the number of unique Active Student Users (${courseActiveStudentUserIds.size})`
            );
        }
        console.log(
            '  Unique Ids missing from unique Active StudentEnrollments:',
            difference(courseActiveStudentUserIds, allSectionsStuIds)
        );
        console.log(
            '  Unique Ids missing from unique Active Student Users:',
            difference(allSectionsStuIds, courseActiveStudentUserIds)
        );

        // Compare enumerating sections based on Users
        const sectionIdUserIdsMap = new Map<string, Set<string>>();
        // Collect Sections based on Users
        for (const stuId of courseActiveStudentUserIds) {
            let noStuSections = true;
            for await (const stuSection of await this.canvasService.getStudentSectionEnrollments(
                this.course.id,
                stuId
            )) {
                if (noStuSections) noStuSections = false;
                if (!sectionIdUserIdsMap.has(stuSection)) sectionIdUserIdsMap.set(stuSection, new Set<string>());
                sectionIdUserIdsMap.get(stuSection)?.add(stuId);
            }
            if (noStuSections)
                console.log(`Warning! An Active Student User (id: ${stuId}) isn't enrolled in any sections`);
        }
        // Compare Enumerated Sections
        if (sectionIdUserIdsMap.size - sectionIdStudentIdsMap.size !== 0) {
            console.log(
                `When enumerating sections by Active Student Users, ${
                    sectionIdUserIdsMap.size - sectionIdStudentIdsMap.size
                } more are found.`
            );
            if (sectionIdUserIdsMap.size - sectionIdStudentIdsMap.size < 0)
                console.log(
                    'Warning! Assumption that User based enumeration of sections returns all sections has been broken.'
                );
        }
        for (const [sectionId, stuUserIds] of sectionIdUserIdsMap) {
            const sectionStus = sectionIdStudentIdsMap.get(sectionId) ?? new Set();
            const secSubUser = nonSubset(sectionStus, stuUserIds);
            const userSubSec = nonSubset(stuUserIds, sectionStus);

            if (secSubUser !== 0 || userSubSec !== 0) {
                console.log(`== Students in Section Id (${sectionId}) Comparison ==`);
                console.log(`   ${secSubUser} students in Section missing from Users`);
                console.log(`   ${userSubSec} students in Users missing from Section`);
            }
        }

        console.log('Comparison Completed');
    }

    async checkAllStudentRecordsDecryption(): Promise<void> {
        if (!this.course) {
            return;
        }

        const password = this.testPassword;
        const salt = this.testSalt;
        if (password === '' || salt === '') {
            console.log('Invalid test Password or Salt...');
            return;
        }

        const testEncryptionKey = await CryptoHelper.deriveAESKey(password, Base64.toUint8Array(salt));
        const config = await this.manager.getTokenATMConfiguration(this.course);
        const placeholderStudent: Student = new Student('0', 'Test');
        let invalidRecordCount = 0;

        if (this.encryptedCommentsCache.length === 0) {
            const students = await DataConversionHelper.convertAsyncIterableToList(
                await this.canvasService.getCourseStudentEnrollments(config.course.id)
            );
            for (const student of students) {
                const logComments = await this.canvasService.getSubmissionComments(
                    config.course.id,
                    student.id,
                    config.logAssignmentId
                );
                let recordCommentCount = logComments.length;
                for (const { content } of logComments) {
                    if (content.startsWith(StudentRecordManagerService.PROMPT)) {
                        const encrypted = content.split('\n')[1];
                        if (encrypted !== undefined) this.encryptedCommentsCache.push(encrypted);
                    } else recordCommentCount--;
                }
                if (recordCommentCount !== 1) {
                    console.log(`WARNING: Student found with ${recordCommentCount} encrypted comments`);
                }
            }

            students.length = 0;
        }

        let decryptedResult: unknown = undefined;
        for (const encryptedComment of this.encryptedCommentsCache) {
            decryptedResult = encryptedComment;
            try {
                // TODO: 2 tests (decrypt and valid Student Record)
                decryptedResult = await config.decryptStudentRecord(encryptedComment, testEncryptionKey);
                StudentRecord.deserialize(config, placeholderStudent, '0', NaN, decryptedResult);
            } catch (error) {
                invalidRecordCount++;
            }
        }

        if (invalidRecordCount === 0) {
            if (decryptedResult === undefined) console.log('No Encrypted Records Found');
            else console.log('Valid Password and Salt!');
        } else {
            console.log('Invalid Student Records with this Password and Salt:', invalidRecordCount);
            console.log('Example:', decryptedResult);
        }
    }
}
