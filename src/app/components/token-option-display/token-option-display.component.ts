import { Component, Input } from '@angular/core';
import type { TokenOption } from 'app/token-options/token-option';

@Component({
    selector: 'app-token-option-display',
    templateUrl: './token-option-display.component.html',
    styleUrls: ['./token-option-display.component.sass']
})
export class TokenOptionDisplayComponent {
    @Input() option?: TokenOption;

    getAbsValue(value: number): number {
        return Math.abs(value);
    }
}
