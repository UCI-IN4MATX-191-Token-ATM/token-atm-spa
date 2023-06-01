import { Inject, Injectable } from '@angular/core';
import { ConfirmationModalComponent } from 'app/components/confirmation-modal/confirmation-modal.component';
import { NotificationModalComponent } from 'app/components/notification-modal/notification-modal.component';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';

@Injectable({
    providedIn: 'root'
})
export class ModalManagerService {
    constructor(@Inject(BsModalService) private modalService: BsModalService) {}

    public async createConfirmationModal(
        message: string,
        heading = 'Confirmation',
        isDanger = false,
        noText = 'Cancel',
        yesText = 'Yes'
    ): Promise<[BsModalRef<ConfirmationModalComponent>, boolean]> {
        let modalResolve: (result: boolean) => void;
        const promise = new Promise<boolean>((resolve) => {
            modalResolve = resolve;
        });
        const initialState: ModalOptions = {
            initialState: {
                message: message,
                heading: heading,
                isDanger: isDanger,
                noText: noText,
                yesText: yesText,
                onResolve: (result: boolean) => {
                    modalResolve(result);
                }
            },
            backdrop: 'static',
            keyboard: false
        };
        const modalRef = this.modalService.show(ConfirmationModalComponent, initialState);
        const result = await promise;
        return [modalRef, result];
    }

    public async createConfirmationModalWithoutRef(
        message: string,
        heading = 'Confirmation',
        isDanger = false,
        noText = 'Cancel',
        yesText = 'Yes'
    ): Promise<boolean> {
        const [modalRef, result] = await this.createConfirmationModal(message, heading, isDanger, noText, yesText);
        modalRef.hide();
        return result;
    }

    public async createNotificationModal(message: string, heading = 'Notification'): Promise<void> {
        let modalResolve: () => void;
        const promise = new Promise<void>((resolve) => {
            modalResolve = resolve;
        });
        const initialState: ModalOptions = {
            initialState: {
                message: message,
                heading: heading,
                onResolve: () => {
                    modalResolve();
                }
            },
            backdrop: 'static',
            keyboard: false
        };
        const modalRef = this.modalService.show(NotificationModalComponent, initialState);
        await promise;
        modalRef.hide();
        return;
    }
}
