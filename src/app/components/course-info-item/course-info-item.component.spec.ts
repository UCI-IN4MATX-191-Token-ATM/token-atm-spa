import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { AxiosService, AxiosServiceFactory } from 'app/services/axios.service';

import { CourseInfoItemComponent } from './course-info-item.component';

describe('CourseInfoItemComponent', () => {
    let component: CourseInfoItemComponent;
    let fixture: ComponentFixture<CourseInfoItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CourseInfoItemComponent],
            providers: [{ provide: AxiosService, useFactory: AxiosServiceFactory.getAxiosService }]
        }).compileComponents();

        fixture = TestBed.createComponent(CourseInfoItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
