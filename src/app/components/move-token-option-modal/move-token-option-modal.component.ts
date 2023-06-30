import { Component, Inject, Input } from '@angular/core';
import type { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import type { TokenOptionGroup } from 'app/data/token-option-group';
import { ModalManagerService } from 'app/services/modal-manager.service';
import { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';
import type { TokenOption } from 'app/token-options/token-option';
import { countAndNoun } from 'app/utils/pluralize';
import type { BsModalRef } from 'ngx-bootstrap/modal';

enum MoveOperation {
    TO_THE_TOP = 'To the top of ...',
    BEFORE = 'Before ...',
    AFTER = 'After ...',
    TO_THE_BOTTOM = 'To the bottom of ...'
}

@Component({
    selector: 'app-move-token-option-modal',
    templateUrl: './move-token-option-modal.component.html',
    styleUrls: ['./move-token-option-modal.component.sass']
})
export class MoveTokenOptionModalComponent {
    isProcessing = false;
    @Input() configuration?: TokenATMConfiguration;
    @Input() srcOption?: TokenOption;
    modalRef?: BsModalRef<unknown>;

    selectedGroup?: TokenOptionGroup;
    selectedOption?: TokenOption;

    moveOperations = MoveOperation;
    selectedOperation: MoveOperation = MoveOperation.TO_THE_TOP;

    constructor(
        @Inject(TokenATMConfigurationManagerService)
        private configurationManagerService: TokenATMConfigurationManagerService,
        @Inject(ModalManagerService) private modalManagerService: ModalManagerService
    ) {}

    onCancel() {
        this.modalRef?.hide();
    }

    async onMove(): Promise<void> {
        if (!this.configuration || !this.srcOption || !this.selectedGroup) return;
        this.isProcessing = true;
        const srcGroup = this.srcOption.group;
        srcGroup.deleteTokenOption(this.srcOption);
        const deleteResult = await this.configurationManagerService.updateTokenOptionGroup(srcGroup);
        this.srcOption.group = this.selectedGroup;
        this.selectedGroup.addTokenOption(this.srcOption, this.destIndex);
        const addResult = await this.configurationManagerService.updateTokenOptionGroup(this.selectedGroup);
        if (!deleteResult || !addResult) {
            const possibleResultErrors: string[] = [
                !deleteResult ? srcGroup : undefined,
                !addResult && (srcGroup != this.selectedGroup || deleteResult) ? this.selectedGroup : undefined
            ]
                .filter((value) => value != undefined)
                .map((value) => value?.name ?? '');
            const numTokenOptionGroupsString = countAndNoun(possibleResultErrors.length, 'token option group');
            await this.modalManagerService.createNotificationModal(
                `Auto update failed for ${numTokenOptionGroupsString}: ${possibleResultErrors.join(
                    ', '
                )}. Please go to Canvas and click the "Save It Now" button in the quiz management page of the quiz or quizzes that the ${numTokenOptionGroupsString} mentioned above belong to.`
            );
        }
        this.modalRef?.hide();
    }

    private get destIndex(): number {
        switch (this.selectedOperation) {
            case MoveOperation.TO_THE_TOP: {
                return 0;
            }
            case MoveOperation.TO_THE_BOTTOM: {
                return this.selectedGroup?.tokenOptions.length ?? -1;
            }
            case MoveOperation.BEFORE: {
                return this.selectedOption ? this.selectedGroup?.tokenOptions.indexOf(this.selectedOption) ?? -1 : -1;
            }
            case MoveOperation.AFTER: {
                return this.selectedOption
                    ? (this.selectedGroup?.tokenOptions.indexOf(this.selectedOption) ?? -2) + 1
                    : -1;
            }
        }
    }

    onSelectTokenOptionGroup(group: TokenOptionGroup) {
        this.selectedGroup = group;
        this.selectedOption = undefined;
    }

    get validTokenOptions(): TokenOption[] | undefined {
        if (
            !this.selectedGroup ||
            this.selectedOperation == MoveOperation.TO_THE_TOP ||
            this.selectedOperation == MoveOperation.TO_THE_BOTTOM
        )
            return undefined;
        return this.selectedGroup.tokenOptions.filter((option) => option != this.srcOption);
    }

    get isValidSelection(): boolean {
        if (!this.selectedGroup) return false;
        if (
            !(
                this.selectedOperation == MoveOperation.TO_THE_TOP ||
                this.selectedOperation == MoveOperation.TO_THE_BOTTOM
            ) &&
            !this.selectedOption
        )
            return false;
        return true;
    }
}
