import { Component, Input } from '@angular/core';
import type { ModalChoice } from 'app/services/modal-manager.service';

@Component({
    selector: 'app-multiple-choice-modal',
    templateUrl: './multiple-choice-modal.component.html',
    styleUrls: ['./multiple-choice-modal.component.sass']
})
export class MultipleChoiceModalComponent {
    @Input() message = '';
    @Input() heading = 'Multiple Choice Modal';
    @Input() choices: ModalChoice[] = [];
    @Input() closeChoice?: ModalChoice;
    @Input() onResolve?: (v: string) => void;
    isProcessing = false;

    async onSelect(choice: ModalChoice): Promise<void> {
        if (!this.onResolve) return;
        this.isProcessing = true;
        if (choice.action) await choice.action();
        this.onResolve(choice.key ?? choice.name);
    }
}
