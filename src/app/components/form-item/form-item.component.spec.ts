import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { FormItemComponent } from './form-item.component';

describe('FormItemComponent', () => {
    let component: FormItemComponent;
    let fixture: ComponentFixture<FormItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FormItemComponent],
            imports: [FormsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(FormItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
