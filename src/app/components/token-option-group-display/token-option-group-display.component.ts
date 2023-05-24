import { Component, Input } from '@angular/core';
import type { TokenOptionGroup } from 'app/data/token-option-group';

@Component({
    selector: 'app-token-option-group-display',
    templateUrl: './token-option-group-display.component.html',
    styleUrls: ['./token-option-group-display.component.sass']
})
export class TokenOptionGroupDisplayComponent {
    @Input() group?: TokenOptionGroup;
    isCollapsed = false;
    hovering = false;
}
