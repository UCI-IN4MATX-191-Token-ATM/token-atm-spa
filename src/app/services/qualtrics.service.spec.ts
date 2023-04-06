import { TestBed } from '@angular/core/testing';

import { QualtricsService } from './qualtrics.service';

describe('QualtricsService', () => {
    let service: QualtricsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(QualtricsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
