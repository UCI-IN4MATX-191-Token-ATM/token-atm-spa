import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';

@Directive({
    selector: '[appCenter]'
})
export class CenterDirective implements OnInit {
    // https://angular.io/api/core/ElementRef
    // https://angular.io/api/core/Renderer2
    constructor(private renderer: Renderer2, private element: ElementRef) {}

    ngOnInit(): void {
        ['d-flex', 'align-items-center', 'justify-content-center', 'vh-100'].forEach((cls: string) => {
            this.renderer.addClass(this.element.nativeElement, cls);
        });
    }
}
