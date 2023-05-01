import { TestBed } from '@angular/core/testing';
import { AxiosService, AxiosServiceFactory } from './axios.service';

import { RawRequestFetcherService } from './raw-request-fetcher.service';

describe('RawRequestFetcherService', () => {
    let service: RawRequestFetcherService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: AxiosService, useFactory: AxiosServiceFactory.getAxiosService }]
        });
        service = TestBed.inject(RawRequestFetcherService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
