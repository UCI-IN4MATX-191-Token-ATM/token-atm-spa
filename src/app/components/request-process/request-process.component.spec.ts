import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestProcessComponent } from './request-process.component';

describe('RequestProcessComponent', () => {
    let component: RequestProcessComponent;
    let fixture: ComponentFixture<RequestProcessComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RequestProcessComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(RequestProcessComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
