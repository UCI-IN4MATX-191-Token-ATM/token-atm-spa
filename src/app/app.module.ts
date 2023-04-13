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

@NgModule({
    declarations: [
        AppComponent,
        CenterDirective,
        LoginComponent,
        FormItemComponent,
        DashboardComponent,
        CourseSelectionComponent,
        CourseInfoItemComponent
    ],
    imports: [BrowserModule, AppRoutingModule, FormsModule, NgbModule],
    providers: [{ provide: AxiosService, useFactory: AxiosServiceFactory.getAxiosService }],
    bootstrap: [AppComponent]
})
export class AppModule {}
