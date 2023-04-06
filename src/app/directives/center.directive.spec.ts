import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CenterDirective } from './center.directive';

@Component({
    template: '<div appCenter></div>'
})
class CenteredComponent {}

describe('CenterDirective', () => {
    let fixture: ComponentFixture<CenteredComponent>;
    let element: HTMLElement;

    beforeEach(() => {
        fixture = TestBed.configureTestingModule({
            declarations: [CenteredComponent, CenterDirective]
        }).createComponent(CenteredComponent);
        element = fixture.nativeElement.querySelector('div');
        fixture.detectChanges();
    });

    ['d-flex', 'align-items-center', 'justify-content-center', 'vh-100'].forEach((cls: string) => {
        it(`should add ${cls} class`, () => {
            expect(element.classList.contains(cls)).toBeTrue();
        });
    });
});
