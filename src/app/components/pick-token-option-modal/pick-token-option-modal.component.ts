import { Component, Input } from '@angular/core';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import type { TokenOption } from 'app/token-options/token-option';

@Component({
    selector: 'app-pick-token-option-modal',
    templateUrl: './pick-token-option-modal.component.html',
    styleUrls: ['./pick-token-option-modal.component.sass']
})
export class PickTokenOptionModalComponent {
    @Input() configuration?: TokenATMConfiguration;
    @Input() onResolve?: (result: TokenOption | undefined) => void;
    @Input() filter?: (option: TokenOption) => boolean;
    isProcessing = false;

    tokenOptionGroup?: TokenOptionGroup;
    tokenOption?: TokenOption;

    onCancel() {
        if (this.onResolve) this.onResolve(undefined);
    }

    onPickTokenOption() {
        if (!this.configuration || !this.onResolve || !this.tokenOption) return;
        this.isProcessing = true;
        this.onResolve(this.tokenOption);
    }

    onSelectTokenOptionGroup(tokenOptionGroup: TokenOptionGroup) {
        this.tokenOptionGroup = tokenOptionGroup;
        this.tokenOption = undefined;
    }

    getValidTokenOptions(group: TokenOptionGroup): TokenOption[] {
        if (!this.filter) return group.tokenOptions;
        return group.tokenOptions.filter(this.filter);
    }
}
