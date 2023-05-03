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
        const pageContent = await this.canvasService.getPageContentByName(course.id, 'Token ATM Configuration');
        const config = JSON.parse(pageContent.substring(3, pageContent.length - 4));
        return new TokenATMConfiguration(course, config, (group, data) => {
            return this.tokenOptionResolverRegistry.resolveTokenOption(group, data);
        });
    }

    // TODO: write save function for TokenATMConfiguration (quiz refresh && configu update)
}
