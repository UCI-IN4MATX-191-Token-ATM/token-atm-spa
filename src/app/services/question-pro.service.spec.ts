import { QuestionProService } from './question-pro.service';
import { type AxiosService } from './axios.service';

describe('QuestionProService', () => {
    let service: QuestionProService;
    let fakeAxiosService: jasmine.SpyObj<AxiosService>;

    beforeEach(async () => {
        fakeAxiosService = jasmine.createSpyObj<AxiosService>('AxiosService', ['request']);
        service = new QuestionProService(fakeAxiosService);

        // Configure Credentials
        await service.configureCredential({
            questionProEnv: 'test',
            questionProUserId: 'null',
            questionProAPIKey: 'null'
        });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(fakeAxiosService).toBeTruthy();
    });

    describe('Testing Survey Response Collection', () => {
        it('Non- 413 and 404 Errors are passed on', async () => {
            fakeAxiosService.request.and.returnValue(Promise.reject(new Error('Some Random Error')));

            await expectAsync(
                service.checkParticipation('1', { type: 'customVariable', variableName: 'custom4' }, '1')
            ).toBeRejectedWithError(Error, 'Some Random Error');
        });

        it('404 Response short-circuits & doesn’t throw error', async () => {
            const http_404 = {
                isAxiosError: true,
                response: { status: 404 }
            };

            fakeAxiosService.request.and.returnValue(Promise.reject(http_404));

            await expectAsync(
                service.checkParticipation('1', { type: 'customVariable', variableName: 'custom4' }, '1')
            ).not.toBeRejectedWithError();
            expect(fakeAxiosService.request).toHaveBeenCalledTimes(1);
        });

        describe('413 Response Errors', () => {
            const http_413 = {
                isAxiosError: true,
                response: { status: 413, data: { response: { error: { httpStatusCode: 413, message: '' } } } }
            };
            const MAX_ATTEMPTS = 3;
            it('Reaching upper bound of retries throws error', async () => {
                fakeAxiosService.request.and.returnValue(Promise.reject(http_413));

                await expectAsync(
                    service.checkParticipation('1', { type: 'customVariable', variableName: 'custom4' }, '1')
                ).toBeRejectedWithError();
                expect(fakeAxiosService.request).toHaveBeenCalledTimes(MAX_ATTEMPTS);
            });

            it('Single retry defaults to halving page size', async () => {
                fakeAxiosService.request.and.returnValues(
                    Promise.reject(http_413),
                    Promise.resolve({ data: { response: [''] } })
                );

                await expectAsync(
                    service.checkParticipation('1', { type: 'customVariable', variableName: 'custom4' }, '1')
                ).toBeResolved();
                expect(fakeAxiosService.request).toHaveBeenCalledTimes(2);
                expect(fakeAxiosService.request.calls.mostRecent().args[0].params.perPage).toBe(500);
            });

            it('Double retry defaults to quartering page size', async () => {
                fakeAxiosService.request.and.returnValues(
                    Promise.reject(http_413),
                    Promise.reject(http_413),
                    Promise.resolve({ data: { response: ['', ''] } })
                );

                await expectAsync(
                    service.checkParticipation('1', { type: 'customVariable', variableName: 'custom4' }, '1')
                ).toBeResolved();
                expect(fakeAxiosService.request).toHaveBeenCalledTimes(3);
                expect(fakeAxiosService.request.calls.mostRecent().args[0].params.perPage).toBe(250);
            });

            const message_413 = (message: string): typeof http_413 => {
                const result = structuredClone(http_413);
                result.response.data.response.error.message = message;
                return result;
            };
            it('Retry page size with largest suggested number', async () => {
                fakeAxiosService.request.and.returnValues(
                    Promise.reject(message_413('1, 5, text text, 80.00, 100, text 750.1')),
                    Promise.resolve({ data: { response: [''] } })
                );

                await expectAsync(
                    service.checkParticipation('1', { type: 'customVariable', variableName: 'custom4' }, '1')
                ).toBeResolved();
                expect(fakeAxiosService.request).toHaveBeenCalledTimes(2);
                expect(fakeAxiosService.request.calls.mostRecent().args[0].params.perPage).toBe(750);
            });

            it('Retry page size is constrained by previous sizes', async () => {
                fakeAxiosService.request.and.returnValues(
                    Promise.reject(http_413),
                    Promise.reject(message_413('1, 5, text text, 80.00, 100, text 750.1')),
                    Promise.resolve({ data: { response: [''] } })
                );

                await expectAsync(
                    service.checkParticipation('1', { type: 'customVariable', variableName: 'custom4' }, '1')
                ).toBeResolved();
                expect(fakeAxiosService.request).toHaveBeenCalledTimes(3);
                expect(fakeAxiosService.request.calls.mostRecent().args[0].params.perPage).toBe(100);
            });

            it('Retry page size won’t except 0 as a suggestion', async () => {
                fakeAxiosService.request.and.returnValues(
                    Promise.reject(http_413),
                    Promise.reject(message_413('0, 0000, 0000, 0000000')),
                    Promise.resolve({ data: { response: [''] } })
                );

                await expectAsync(
                    service.checkParticipation('1', { type: 'customVariable', variableName: 'custom4' }, '1')
                ).toBeResolved();
                expect(fakeAxiosService.request).toHaveBeenCalledTimes(3);
                expect(fakeAxiosService.request.calls.mostRecent().args[0].params.perPage).toBe(250);
            });

            it('Error after a 413 is noted', async () => {
                fakeAxiosService.request.and.returnValues(
                    Promise.reject(http_413),
                    Promise.reject('Some Random Error')
                );

                await expectAsync(
                    service.checkParticipation('1', { type: 'customVariable', variableName: 'custom4' }, '1')
                ).toBeRejectedWithError(
                    Error,
                    'Error occurred while attempting to handle QuestionPro Responses Page Size Change (Attempt: 2)'
                );
            });

            it('Error causes from previous retries are collected', async () => {
                const mes1 = '1, 5, text text, 80.00, 100, text 750.1';
                const mes3 = 'Non-Digit containing message';
                const pageMes = 'QuestionPro Page Size Too Large';
                fakeAxiosService.request.and.returnValues(
                    Promise.reject(message_413(mes1)), // Returned after Page Size: 1000
                    Promise.reject(http_413), // Returned after Page Size: 750
                    Promise.reject(message_413(mes3)) // Returned after Page Size 375
                );

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let error: any;
                try {
                    await service.checkParticipation('1', { type: 'customVariable', variableName: 'custom4' }, '1');
                } catch (e: unknown) {
                    error = e;
                }

                // Outer Error Wrapper
                expect(error).toBeTruthy();
                expect(error?.cause).toBeTruthy();
                expect(error?.message).toEqual(
                    `Failed to handle QuestionPro Responses Page Size Change in ${MAX_ATTEMPTS} attempts`
                );

                // Inner Retry Errors
                expect(error?.cause?.previous?.message).toEqual(pageMes);
                expect(error?.cause?.previous?.cause?.error).toEqual(message_413(mes3));
                expect(error?.cause?.previous?.cause?.previous?.message).toEqual(pageMes);
                expect(error?.cause?.previous?.cause?.previous?.cause?.error).toEqual(http_413);
                expect(error?.cause?.previous?.cause?.previous?.cause?.previous?.message).toEqual(pageMes);
                expect(error?.cause?.previous?.cause?.previous?.cause?.previous?.cause?.error).toEqual(
                    message_413(mes1)
                );

                // Axios Service Request Double Check
                expect(fakeAxiosService.request).toHaveBeenCalledTimes(3);
                expect(fakeAxiosService.request.calls.mostRecent().args[0].params.perPage).toBe(375);
            });
        });
    });
});
