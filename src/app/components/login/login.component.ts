import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormItemInfo } from 'app/data/form-item-info';
import { TokenATMCredentials } from 'app/data/token-atm-credentials';
import { CanvasService } from 'app/services/canvas.service';
import { QualtricsService } from 'app/services/qualtrics.service';

type CredentialsFormItemInfoMap = {
    [credentialID in keyof TokenATMCredentials]: FormItemInfo;
};

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.sass']
})
export class LoginComponent {
    openLink() {
        window.open(
            'https://docs.google.com/document/d/1KzO0Aic923z5rmvbmKJJ43suaz4IwG4RhmAtLUyVfeY/edit?usp=sharing',
            '_blank'
        );
    }
    credentials = new TokenATMCredentials();

    constructor(
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(QualtricsService) private qualtricsService: QualtricsService,
        @Inject(Router) private router: Router
    ) {}

    static CREDENTIALS_FORM_ITEM_INFO_MAP: CredentialsFormItemInfoMap = {
        canvasURL: new FormItemInfo(
            'canvasURL',
            'Canvas URL',
            'url',
            'https://canvas.instructure.com',
            'Example: https://canvas.eee.uci.edu/'
        ),
        canvasAccessToken: new FormItemInfo(
            'canvasAccessToken',
            'Canvas Access Token',
            'password',
            '',
            'Example: 1081~prKixoT8pyE04DPBIgmTod2IhyVTNUj7aVhazDI3UKbwt314ha31c6YXgxCpnOxH'
        ),
        qualtricsDataCenter: new FormItemInfo(
            'qualtricsDataCenter',
            'Qualtrics Data Center',
            'text',
            '',
            'Example: sjc2'
        ),
        qualtricsClientID: new FormItemInfo(
            'qualtricsClientID',
            'Qualtrics Client ID',
            'text',
            '',
            'Example: m2fdch523fe62h7ds896b06587fhn650'
        ),
        qualtricsClientSecret: new FormItemInfo(
            'qualtricsClientSecret',
            'Qualtrics Client Secret',
            'password',
            '',
            'Example: ye8gf6hGdscTFPn3zVs4Z3YI0amMk2zbccx2KJbhKv0JFrbsKFiOKPvctMYP6UjT'
        )
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

    async onSubmitCredential(): Promise<void> {
        const isCanvasCredentialValid = await this.canvasService.configureCredential(
            this.credentials.canvasURL,
            this.credentials.canvasAccessToken
        );
        const isQualtricsCredentialValid = await this.qualtricsService.configureCredential(
            this.credentials.qualtricsDataCenter,
            this.credentials.qualtricsClientID,
            this.credentials.qualtricsClientSecret
        );
        if (isCanvasCredentialValid && isQualtricsCredentialValid) {
            this.credentials = new TokenATMCredentials();
            this.router.navigate(['/select-course']);
            return;
        } else {
            // TODO: handle invalid credentials
        }
    }
}
