import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-notification-modal',
    templateUrl: './notification-modal.component.html',
    styleUrls: ['./notification-modal.component.sass']
})
export class NotificationModalComponent {
    @Input() message = '';
    @Input() heading = 'Notification';
    @Input() onResolve?: () => void;
}
