import { TestBed } from '@angular/core/testing';

import { CredentialManagerService } from './credential-manager.service';

describe('CredentialManagerService', () => {
    let service: CredentialManagerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CredentialManagerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
