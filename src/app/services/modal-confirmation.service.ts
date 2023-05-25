import { Inject, Injectable } from '@angular/core';
import { ConfirmationModalComponent } from 'app/components/confirmation-modal/confirmation-modal.component';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';

@Injectable({
    providedIn: 'root'
})
export class ModalConfirmationService {
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
}
