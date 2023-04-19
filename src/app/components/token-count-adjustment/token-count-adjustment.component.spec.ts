import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenCountAdjustmentComponent } from './token-count-adjustment.component';

describe('TokenCountAdjustmentComponent', () => {
    let component: TokenCountAdjustmentComponent;
    let fixture: ComponentFixture<TokenCountAdjustmentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TokenCountAdjustmentComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TokenCountAdjustmentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
