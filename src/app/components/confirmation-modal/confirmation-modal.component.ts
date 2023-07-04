import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-confirmation-modal',
    templateUrl: './confirmation-modal.component.html',
    styleUrls: ['./confirmation-modal.component.sass']
})
export class ConfirmationModalComponent {
    @Input() message = '';
    @Input() heading = 'Confirmation';
    @Input() noText = 'Cancel';
    @Input() yesText = 'Yes';
    @Input() isDanger = false;
    @Input() disableButton = false;
    @Input() onResolve?: (result: boolean) => void;
}
