import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
    selector: 'app-switch-field-item-wrapper',
    templateUrl: './switch-field-item-wrapper.component.html'
})
export class SwitchFieldItemWrapperComponent implements OnInit {
    @ViewChild('container', { static: true, read: ViewContainerRef }) containerRef?: ViewContainerRef;

    renderer?: (container: ViewContainerRef) => void;

    isShown = false;

    ngOnInit() {
        if (!this.renderer || !this.containerRef) throw new Error('Fail to initialize SiwtchFieldItemWrapperComponent');
        this.renderer(this.containerRef);
    }

    public show(): void {
        this.isShown = true;
    }

    public hide(): void {
        this.isShown = false;
    }

    public setDisplayState(state: boolean) {
        this.isShown = state;
    }
}
