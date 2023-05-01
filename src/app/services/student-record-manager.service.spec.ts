import { TestBed } from '@angular/core/testing';
import { AxiosService, AxiosServiceFactory } from './axios.service';

import { StudentRecordManagerService } from './student-record-manager.service';

describe('StudentRecordManagerService', () => {
    let service: StudentRecordManagerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: AxiosService, useFactory: AxiosServiceFactory.getAxiosService }]
        });
        service = TestBed.inject(StudentRecordManagerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
