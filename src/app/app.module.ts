import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// https://stackoverflow.com/questions/38892771/cant-bind-to-ngmodel-since-it-isnt-a-known-property-of-input
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CenterDirective } from './directives/center.directive';
import { LoginComponent } from './components/login/login.component';
import { FormItemComponent } from './components/form-item/form-item.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AxiosServiceFactory } from './services/axios.service';
import { AxiosService } from './services/axios.service';
import { CourseSelectionComponent } from './components/course-selection/course-selection.component';
import { CourseInfoItemComponent } from './components/course-info-item/course-info-item.component';
import { RequestProcessComponent } from './components/request-process/request-process.component';
import { TokenOptionConfigurationComponent } from './components/token-option-configuration/token-option-configuration.component';
import { StudentListComponent } from './components/student-list/student-list.component';
import {
    REGISTERED_TOKEN_OPTION_RESOLVERS,
    TOKEN_OPTION_RESOLVER_INJECTION_TOKEN
} from './token-option-resolvers/token-option-resolver-registry';
import {
    REGISTERED_REQUEST_RESOLVERS,
    REQUEST_RESOLVER_INJECT_TOKEN
} from './request-resolvers/request-resolver-registry';
import { REGISTERED_REQUEST_HANDLERS, REQUEST_HANDLER_INJECT_TOKEN } from './request-handlers/request-handler-registry';
import { DevTestComponent } from './components/dev-test/dev-test.component';

@NgModule({
    declarations: [
        AppComponent,
        CenterDirective,
        LoginComponent,
        FormItemComponent,
        DashboardComponent,
        CourseSelectionComponent,
        CourseInfoItemComponent,
        RequestProcessComponent,
        TokenOptionConfigurationComponent,
        StudentListComponent,
        DevTestComponent
    ],
    imports: [BrowserModule, AppRoutingModule, FormsModule, NgbModule],
    providers: [
        { provide: AxiosService, useFactory: AxiosServiceFactory.getAxiosService },
        ...REGISTERED_TOKEN_OPTION_RESOLVERS.map((cls) => ({
            provide: TOKEN_OPTION_RESOLVER_INJECTION_TOKEN,
            useClass: cls,
            multi: true
        })),
        ...REGISTERED_REQUEST_RESOLVERS.map((cls) => ({
            provide: REQUEST_RESOLVER_INJECT_TOKEN,
            useClass: cls,
            multi: true
        })),
        ...REGISTERED_REQUEST_HANDLERS.map((cls) => ({
            provide: REQUEST_HANDLER_INJECT_TOKEN,
            useClass: cls,
            multi: true
        }))
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
