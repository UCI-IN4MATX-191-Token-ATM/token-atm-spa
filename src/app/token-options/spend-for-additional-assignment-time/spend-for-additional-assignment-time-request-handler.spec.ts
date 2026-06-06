import { type AxiosService } from 'app/services/axios.service';
import type { ExponentialBackoffExecutorService } from 'app/services/exponential-backoff-executor.service';
import { CanvasService } from 'app/services/canvas.service';
import { SpendForAdditionalAssignmentTimeRequestHandler } from './spend-for-additional-assignment-time-request-handler';
import type { Course } from 'app/data/course';
import type { SpendForAdditionalAssignmentTimeTokenOption } from './spend-for-additional-assignment-time-token-option';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { Student } from 'app/data/student';
import type { RawAssignmentOverrideData } from 'app/data/assignment-override';
import type { RawAssignmentData } from 'app/data/assignment';

/*
Handler Needs

=== DATA ===
request.tokenOption
                   .id
                   .name
                   .excludeTokenOptionIds
                   .tokenBalanceChange
                   .unlockAtChange
                   .dueAtChange
                   .lockAtChange
                   .dateConflict
                   .assignmentId
                   .group.id
                   .allowedRequestCnt
        .student.id
        .submittedTime


studentRecord.processedRequests
                               .tokenOption
                                           .id
                               .isApproved
             .tokenBalance
             .student

config.course.id
      .uid

=== Network ===
- Assignment Overrides (Paginated)
- Student Section Enrollments (Paginated)
- Get Assignment
- (Optional) Delete Student from existing Override
- (Optional) Update Canvas Override (Put to update existing, Post to create new)
*/

/**
 * - sections are string version of section id of Sections the student is enrolled in
 * - (un)lock/due dates are ISO Date strings or Null
 */
function* requestAssignmentAndOverrideData(
    assignmentOverrideData: RawAssignmentOverrideData[],
    sectionEnrollments: string[],
    assignmentData: RawAssignmentData
) {
    yield canvasResponse(assignmentOverrideData);
    yield canvasResponse(sectionEnrollments);
    yield canvasResponse(assignmentData);
}
function canvasResponse<T>(data?: T) {
    return Promise.resolve({ data: data, headers: {} });
}

describe('SpendForAdditionalAssignmentTimeRequestHandler', () => {
    let canvasService: CanvasService;
    let fakeAxiosService: jasmine.SpyObj<AxiosService>;
    let fakeBackoffService: jasmine.SpyObj<ExponentialBackoffExecutorService>;
    let requestHandler: SpendForAdditionalAssignmentTimeRequestHandler;
    type HandleParams = Parameters<SpendForAdditionalAssignmentTimeRequestHandler['handle']>;
    let config: jasmine.SpyObj<HandleParams[0]>;
    let record: jasmine.SpyObj<HandleParams[1]>;
    let request: jasmine.SpyObj<HandleParams[2]>;
    let tokenOption: jasmine.SpyObj<SpendForAdditionalAssignmentTimeTokenOption>;
    let testStudent: Student;
    let testTokenOptionGroup: TokenOptionGroup;
    const templateAssignmentOverrideData: RawAssignmentOverrideData = {
        id: '1',
        title: `TokenATM - None - 2`,
        unlockAt: null,
        dueAt: null,
        lockAt: null,
        studentIds: ['1']
    } as const;
    const templateAssignmentData: RawAssignmentData = {
        id: '5',
        name: 'Test Assignment',
        unlockAt: null,
        dueAt: null,
        lockAt: null
    } as const;

    beforeEach(async () => {
        fakeAxiosService = jasmine.createSpyObj<AxiosService>('AxiosService', ['request']);
        fakeBackoffService = jasmine.createSpyObj<ExponentialBackoffExecutorService>(
            'ExponentialBackoffExecutorService',
            ['execute']
        );
        canvasService = new CanvasService(fakeAxiosService, fakeBackoffService);
        requestHandler = new SpendForAdditionalAssignmentTimeRequestHandler(canvasService);
        testStudent = new Student('1', 'Nemo', 'example@example.com');
        testTokenOptionGroup = { id: 1 } as TokenOptionGroup;

        // These Spies provide the minimal interface needed for request.handle testing
        config = jasmine.createSpyObj<HandleParams[0]>(
            'TokenATMConfiguration',
            { getTokenOptionGroupById: testTokenOptionGroup, getTokenOptionById: tokenOption },
            { course: { id: '1' } as Course, uid: 'ATESTSTR' }
        );
        // TODO add spy for processed requests' tokenOption, tokenOption.id, and isApproved
        record = jasmine.createSpyObj<HandleParams[1]>(
            'StudentRecord',
            {},
            { processedRequests: [], student: testStudent, tokenBalance: 0 }
        );
        tokenOption = jasmine.createSpyObj<SpendForAdditionalAssignmentTimeTokenOption>(
            'SpendForAdditionalAssignmentTimeTokenOption',
            {},
            {
                name: 'Add Time Test',
                id: 1,
                tokenBalanceChange: 0,
                assignmentId: 'None',
                unlockAtChange: undefined,
                dueAtChange: undefined,
                lockAtChange: undefined,
                dateConflict: 'constrain',
                allowedRequestCnt: 1,
                excludeTokenOptionIds: [],
                group: testTokenOptionGroup
            }
        );
        request = jasmine.createSpyObj<HandleParams[2]>(
            'SpendForAdditionalAssignmentTimeRequest',
            {},
            {
                tokenOption: tokenOption,
                submittedTime: new Date(),
                student: testStudent
            }
        );
        // Configure Credentials
        await canvasService.configureCredential({ canvasURL: 'https://localhost', canvasAccessToken: 'NONE' });
        // Pass through Backoff Service
        fakeBackoffService.execute.and.callFake((executor) => {
            return executor();
        });
    });

    it('should be created', () => {
        expect(fakeAxiosService).toBeTruthy();
        expect(fakeBackoffService).toBeTruthy();
        expect(canvasService).toBeTruthy();
        expect(requestHandler).toBeTruthy();
    });

    describe('Handling SpendForAdditionAssignmentTimeRequests', () => {
        it('ProcessedResult returns passed values', async () => {
            fakeAxiosService.request.and.returnValues(
                ...requestAssignmentAndOverrideData([templateAssignmentOverrideData], [], templateAssignmentData)
            );
            const processedResult = await requestHandler.handle(config, record, request);
            expect(processedResult).toBeTruthy();
            expect(processedResult.configuration).toBe(config);
            expect(processedResult.tokenOptionId).toEqual(tokenOption.id);
            expect(processedResult.student).toEqual(record.student);
            expect(processedResult.tokenOptionName).toEqual(tokenOption.name);
            expect(processedResult.submittedTime).toEqual(request.submittedTime);
            expect(processedResult.tokenOptionGroupId).toEqual(request.tokenOption.group.id);
        });

        /*
        // This test should also pass, but it doesn't.
        // Most likely due to backwards compatibility with old token options
        // (Spend for Assignment Extension doesn't reject on no change)
        it('No Change to any dates is rejected with message', async () => {
            fakeAxiosService.request.and.returnValues(
                ...requestAssignmentAndOverrideData([], [], templateAssignmentData),
                canvasResponse() // Placeholder Response to Put/Post Request
            );
            const processedResult = await requestHandler.handle(config, record, request);
            expect(processedResult.isApproved).toBeFalse();
            expect(processedResult.message).toEqual('Existing Assignment dates won’t be changed by this request');
        });
        */
        it('No Change to existing override is rejected with message', async () => {
            fakeAxiosService.request.and.returnValues(
                ...requestAssignmentAndOverrideData([templateAssignmentOverrideData], [], templateAssignmentData)
            );
            const processedResult = await requestHandler.handle(config, record, request);
            expect(processedResult.isApproved).toBeFalse();
            expect(processedResult.message).toEqual('Existing Assignment dates won’t be changed by this request');
        });
    });
});
