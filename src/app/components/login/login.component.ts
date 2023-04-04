import { Component } from '@angular/core';
import { FormItemInfo } from 'app/data/form-item-info';
import { TokenATMCredentials } from 'app/data/token-atm-credentials';

type CredentialsFormItemInfoMap = {
    [credentialID in keyof TokenATMCredentials]: FormItemInfo;
};

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.sass']
})
export class LoginComponent {
    credentials = new TokenATMCredentials();

    static CREDENTIALS_FORM_ITEM_INFO_MAP: CredentialsFormItemInfoMap = {
        canvasURL: new FormItemInfo('canvasURL', 'Canvas URL', 'url', 'https://canvas.instructure.com'),
        canvasAccessToken: new FormItemInfo('canvasAccessToken', 'Canvas Access Token', 'password'),
        qualtricsDataCenter: new FormItemInfo('qualtricsDataCenter', 'Qualtrics Data Center', 'text', ''),
        qualtricsClientID: new FormItemInfo('qualtricsClientID', 'Qualtrics Client ID', 'text', ''),
        qualtricsClientSecret: new FormItemInfo('qualtricsClientSecret', 'Qualtrics Client Secret', 'password', '')
    };

    static CREDENTIALS_ID_LIST: (keyof TokenATMCredentials)[] = [
        'canvasURL',
        'canvasAccessToken',
        'qualtricsDataCenter',
        'qualtricsClientID',
        'qualtricsClientSecret'
    ];

    getCredentialsFormItemInfoMap(): CredentialsFormItemInfoMap {
        return LoginComponent.CREDENTIALS_FORM_ITEM_INFO_MAP;
    }

    getCredentialIDList(): (keyof TokenATMCredentials)[] {
        return LoginComponent.CREDENTIALS_ID_LIST;
    }

    onSubmitCredential(): void {
        // TODO
        this.credentials = new TokenATMCredentials();
    }
}
