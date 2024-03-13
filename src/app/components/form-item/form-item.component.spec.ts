import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { FormItemComponent } from './form-item.component';
import { first } from 'rxjs';
import { FormItemInfo } from 'app/data/form-item-info';

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
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('uuid should be initialized properly after ngOnInit', () => {
        expect(component.uuid).toEqual('');
        component.ngOnInit();
        expect(component.uuid).not.toEqual('');
    });

    it('event should be emitted to dataChange when data change on the input occurs', () => {
        component.dataChange.pipe(first()).subscribe((value: string) => expect(value).toBe('AAAAAAAAAAAA'));
        component.onDataChange('AAAAAAAAAAAA');
    });

    it('label should be properly rendered using the provided form item info', () => {
        component.info = new FormItemInfo('labelTest', 'Label Test', 'text');
        fixture.detectChanges();
        const labelElement = fixture.nativeElement.querySelector('label');
        expect(labelElement.htmlFor).toEqual(`${'labelTest' + component.uuid}`);
        expect(labelElement.textContent).toEqual('Label Test');
    });

    it('input type should be properly assigned using the provided form item info', () => {
        component.info = new FormItemInfo('labelTest', 'Label Test', 'number');
        fixture.detectChanges();
        const inputElement = fixture.nativeElement.querySelector('input');
        expect(inputElement.type).toEqual('number');
    });
});
