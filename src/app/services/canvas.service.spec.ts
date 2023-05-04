import { TestBed } from '@angular/core/testing';
import { AxiosService, AxiosServiceFactory } from './axios.service';

import { CanvasService } from './canvas.service';

describe('CanvasService', () => {
    let service: CanvasService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: AxiosService, useFactory: AxiosServiceFactory.getAxiosService }]
        });
        service = TestBed.inject(CanvasService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
