import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AxiosService, AxiosServiceFactory } from 'app/services/axios.service';
import { FormItemComponent } from '../form-item/form-item.component';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [LoginComponent, FormItemComponent],
            imports: [FormsModule],
            providers: [{ provide: AxiosService, useFactory: AxiosServiceFactory.getAxiosService }]
        }).compileComponents();

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
