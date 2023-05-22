import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AxiosService, AxiosServiceFactory } from 'app/services/axios.service';

import { DevTestComponent } from './dev-test.component';

describe('DevTestComponent', () => {
    let component: DevTestComponent;
    let fixture: ComponentFixture<DevTestComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DevTestComponent],
            providers: [{ provide: AxiosService, useFactory: AxiosServiceFactory.getAxiosService }]
        }).compileComponents();

        fixture = TestBed.createComponent(DevTestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
