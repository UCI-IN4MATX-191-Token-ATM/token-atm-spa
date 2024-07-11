import { type TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { type ModalManagerService } from 'app/services/modal-manager.service';
import type { TokenATMConfigurationManagerService } from 'app/services/token-atm-configuration-manager.service';

/**
 * Checks if the Token ATM Log assignment is published on Canvas. And uses a modal to ask
 * the user if they want Token ATM to publish it on their behalf.
 * @param action The action/reason why the Token ATM Log needs to be published
 * @param configuration The current Token ATM Configuration
 * @param configurationManager The configuration manager service
 * @param modalManager The modal manager service
 * @returns True if the Log is published, False if unpublished and User didn't want it published
 */
export async function checkAndConfirmTokenATMLogPublished(
    action: string,
    configuration: TokenATMConfiguration,
    configurationManager: TokenATMConfigurationManagerService,
    modalManager: ModalManagerService
): Promise<boolean> {
    const isLogPublished = async () => await configurationManager.isTokenATMLogPublished(configuration);
    const confirmPublishModal = async () => {
        const [confirmationRef, result] = await modalManager.createConfirmationModal(
            `The Token ATM Log assignment on Canvas must be published to ${action}.\n\nWould you like Token ATM to publish this assignment for you?`,
            'Publish Token ATM Log?',
            false,
            'I’ll publish it myself.',
            'Yes, publish it for me.'
        );
        if (result) {
            if (confirmationRef.content) confirmationRef.content.disableButton = true;
            await configurationManager.publishTokenATMLog(configuration);
            confirmationRef.hide();
            return true;
        } else {
            confirmationRef.hide();
            return false;
        }
    };
    return (await isLogPublished()) || (await confirmPublishModal());
}
