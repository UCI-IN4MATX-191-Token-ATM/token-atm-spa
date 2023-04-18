import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenOptionConfigurationComponent } from './token-option-configuration.component';

describe('TokenOptionConfigurationComponent', () => {
    let component: TokenOptionConfigurationComponent;
    let fixture: ComponentFixture<TokenOptionConfigurationComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TokenOptionConfigurationComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TokenOptionConfigurationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
