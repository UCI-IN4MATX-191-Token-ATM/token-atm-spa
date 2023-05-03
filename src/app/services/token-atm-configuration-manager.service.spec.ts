import { TestBed } from '@angular/core/testing';
import { AxiosService, AxiosServiceFactory } from './axios.service';

import { TokenATMConfigurationManagerService } from './token-atm-configuration-manager.service';

describe('TokenATMConfigurationManagerService', () => {
    let service: TokenATMConfigurationManagerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: AxiosService, useFactory: AxiosServiceFactory.getAxiosService }]
        });
        service = TestBed.inject(TokenATMConfigurationManagerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
