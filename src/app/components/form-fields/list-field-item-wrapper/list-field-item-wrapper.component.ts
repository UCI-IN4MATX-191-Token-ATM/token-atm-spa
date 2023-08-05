import { Component, EventEmitter, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
    selector: 'app-list-field-item-wrapper',
    templateUrl: './list-field-item-wrapper.component.html',
    styleUrls: ['./list-field-item-wrapper.component.sass']
})
export class ListFieldItemWrapperComponent implements OnInit {
    @Input() renderer?: (viewContainerRef: ViewContainerRef) => void;
    @Input() isReadOnly = false;
    @Input() remove = new EventEmitter<void>();
    @ViewChild('container', { read: ViewContainerRef, static: true }) viewContainerRef?: ViewContainerRef;

    ngOnInit() {
        if (this.viewContainerRef && this.renderer) this.renderer(this.viewContainerRef);
    }
}
