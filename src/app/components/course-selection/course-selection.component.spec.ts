import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AxiosService, AxiosServiceFactory } from 'app/services/axios.service';

import { CourseSelectionComponent } from './course-selection.component';

describe('CourseSelectionComponent', () => {
    let component: CourseSelectionComponent;
    let fixture: ComponentFixture<CourseSelectionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CourseSelectionComponent],
            providers: [{ provide: AxiosService, useFactory: AxiosServiceFactory.getAxiosService }],
            imports: [NgbModule]
        }).compileComponents();

        fixture = TestBed.createComponent(CourseSelectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
