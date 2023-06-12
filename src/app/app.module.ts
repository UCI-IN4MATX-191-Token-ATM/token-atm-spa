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
import { TokenOptionGroupDisplayComponent } from './components/token-option-group-display/token-option-group-display.component';
import { TokenOptionDisplayComponent } from './components/token-option-display/token-option-display.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { StudentRecordDisplayComponent } from './components/student-record-display/student-record-display.component';
import { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal.component';
import { ModalModule } from 'ngx-bootstrap/modal';
import { NotificationModalComponent } from './components/notification-modal/notification-modal.component';
import { ConfigurationComponent } from './components/configuration/configuration.component';
import { TokenOptionGroupManagementComponent } from './components/token-option-group-management/token-option-group-management.component';
import { StringInputFieldComponent } from './components/form-fields/string-input-field/string-input-field.component';
import { StringTextareaFieldComponent } from './components/form-fields/string-textarea-field/string-textarea-field.component';
import { NumberInputFieldComponent } from './components/form-fields/number-input-field/number-input-field.component';
import { TokenOptionManagementComponent } from './components/token-option-management/token-option-management.component';
import { EarnByQuizTokenOptionFieldComponent } from './components/form-fields/token-option-fields/earn-by-quiz-token-option-field/earn-by-quiz-token-option-field.component';
import { DateTimeFieldComponent } from './components/form-fields/date-time-field/date-time-field.component';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { EarnBySurveyTokenOptionFieldComponent } from './components/form-fields/token-option-fields/earn-by-survey-token-option-field/earn-by-survey-token-option-field.component';
import { BasicTokenOptionFieldComponent } from './components/form-fields/token-option-fields/basic-token-option-field/basic-token-option-field.component';
import { EarnByModuleTokenOptionFieldComponent } from './components/form-fields/token-option-fields/earn-by-module-token-option-field/earn-by-module-token-option-field.component';
import { CreateTokenOptionModalComponent } from './components/create-token-option-modal/create-token-option-modal.component';
import { SpendForLabDataTokenOptionFieldComponent } from './components/form-fields/token-option-fields/spend-for-lab-data-token-option-field/spend-for-lab-data-token-option-field.component';
import { SpendForAssignmentResubmissionTokenOptionFieldComponent } from './components/form-fields/token-option-fields/spend-for-assignment-resubmission-token-option-field/spend-for-assignment-resubmission-token-option-field.component';
import { WithdrawLabDataTokenOptionFieldComponent } from './components/form-fields/token-option-fields/withdraw-lab-data-token-option-field/withdraw-lab-data-token-option-field.component';
import { WithdrawAssignmentResubmissionOptionFieldComponent } from './components/form-fields/token-option-fields/withdraw-assignment-resubmission-option-field/withdraw-assignment-resubmission-option-field.component';

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
        DevTestComponent,
        TokenOptionGroupDisplayComponent,
        TokenOptionDisplayComponent,
        StudentRecordDisplayComponent,
        ConfirmationModalComponent,
        NotificationModalComponent,
        ConfigurationComponent,
        TokenOptionGroupManagementComponent,
        StringInputFieldComponent,
        StringTextareaFieldComponent,
        NumberInputFieldComponent,
        TokenOptionManagementComponent,
        EarnByQuizTokenOptionFieldComponent,
        DateTimeFieldComponent,
        EarnBySurveyTokenOptionFieldComponent,
        BasicTokenOptionFieldComponent,
        EarnByModuleTokenOptionFieldComponent,
        CreateTokenOptionModalComponent,
        SpendForLabDataTokenOptionFieldComponent,
        SpendForAssignmentResubmissionTokenOptionFieldComponent,
        WithdrawLabDataTokenOptionFieldComponent,
        WithdrawAssignmentResubmissionOptionFieldComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        NgbModule,
        BsDropdownModule.forRoot(),
        BrowserAnimationsModule,
        CollapseModule.forRoot(),
        ModalModule.forRoot(),
        BsDatepickerModule.forRoot(),
        TimepickerModule.forRoot()
    ],
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
