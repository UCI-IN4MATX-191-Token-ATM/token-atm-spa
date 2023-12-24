import { Inject, Injectable } from '@angular/core';
import { ConfirmationModalComponent } from 'app/components/confirmation-modal/confirmation-modal.component';
import { MultipleChoiceModalComponent } from 'app/components/multiple-choice-modal/multiple-choice-modal.component';
import { NotificationModalComponent } from 'app/components/notification-modal/notification-modal.component';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { firstValueFrom } from 'rxjs';

export type ModalChoice = {
    key?: string;
    name: string;
    bsColor?: string;
    action?: () => Promise<void>;
};

@Injectable({
    providedIn: 'root'
})
export class ModalManagerService {
    constructor(@Inject(BsModalService) private modalService: BsModalService) {}

    /**
     * Create a modal to collect user confirmation
     * @param message Message in modal body
     * @param heading Header text of modal
     * @param isDanger Flag for marking if confirmation may have an irreversible result
     * @param noText Declination text
     * @param yesText Affirmation text
     * @returns Reference to the modal, and the user's choice
     */
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

    /**
     * Create a modal to collect user confirmation (Should not be used with asynchronous functionality)
     * @param message Message in modal body
     * @param heading Header text of modal
     * @param isDanger Flag for marking if confirmation may have an irreversible result
     * @param noText Declination text
     * @param yesText Affirmation text
     * @returns User's choice
     */
    public async createConfirmationModalWithoutRef(
        message: string,
        heading = 'Confirmation',
        isDanger = false,
        noText = 'Cancel',
        yesText = 'Yes'
    ): Promise<boolean> {
        const [modalRef, result] = await this.createConfirmationModal(message, heading, isDanger, noText, yesText);
        const onHiddenPromise = modalRef.onHidden ? firstValueFrom(modalRef.onHidden) : undefined;
        modalRef.hide();
        if (onHiddenPromise) await onHiddenPromise;
        return result;
    }

    /**
     * Create a modal to notify the user
     * @param message Message in modal body
     * @param heading Header text of modal
     * @returns Nothing once the modal is dismissed
     */
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

    public async createMultipleChoiceModalWithoutRef(
        message: string,
        choices: ModalChoice[],
        closeChoice?: ModalChoice,
        heading = 'Multiple Choice Modal'
    ): Promise<string> {
        let modalResolve: (v: string) => void;
        const promise = new Promise<string>((resolve) => {
            modalResolve = resolve;
        });
        const modalRef = this.modalService.show(MultipleChoiceModalComponent, {
            initialState: {
                message: message,
                choices: choices,
                closeChoice: closeChoice,
                heading: heading,
                onResolve: (v: string) => {
                    modalResolve(v);
                }
            },
            backdrop: 'static',
            keyboard: false
        });
        const onHiddenPromise = modalRef.onHidden ? firstValueFrom(modalRef.onHidden) : undefined;
        const result = await promise;
        modalRef.hide();
        if (onHiddenPromise) await onHiddenPromise;
        return result;
    }
}
