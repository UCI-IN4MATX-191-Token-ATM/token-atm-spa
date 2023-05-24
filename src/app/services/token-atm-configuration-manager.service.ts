import { Inject, Injectable } from '@angular/core';
import type { Course } from 'app/data/course';
import { TokenATMConfiguration } from 'app/data/token-atm-configuration';
import { TokenOptionResolverRegistry } from 'app/token-option-resolvers/token-option-resolver-registry';
import { CanvasService } from './canvas.service';

@Injectable({
    providedIn: 'root'
})
export class TokenATMConfigurationManagerService {
    constructor(
        @Inject(CanvasService) private canvasService: CanvasService,
        @Inject(TokenOptionResolverRegistry) private tokenOptionResolverRegistry: TokenOptionResolverRegistry
    ) {}

    public async getTokenATMConfiguration(course: Course): Promise<TokenATMConfiguration> {
        let pageContent = await this.canvasService.getPageContentByName(course.id, 'Token ATM Configuration');
        pageContent = pageContent.substring(3, pageContent.length - 4);
        let secureContent = await this.canvasService.getPageContentByName(
            course.id,
            'Token ATM Encryption Key (PLEASE DO NOT PUBLISH IT)'
        );
        secureContent = secureContent.substring(3, secureContent.length - 4);
        const config = JSON.parse(pageContent),
            secureConfig = JSON.parse(secureContent);
        return new TokenATMConfiguration(course, config, secureConfig, (group, data) => {
            return this.tokenOptionResolverRegistry.resolveTokenOption(group, data);
        });
    }

    // TODO: write save function for TokenATMConfiguration (quiz refresh && configu update)
}
