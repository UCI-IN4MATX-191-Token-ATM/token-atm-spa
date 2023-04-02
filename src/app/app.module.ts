import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CenterDirective } from './directives/center.directive';

@NgModule({
    declarations: [AppComponent, CenterDirective],
    imports: [BrowserModule, AppRoutingModule],
    providers: [NgbModule],
    bootstrap: [AppComponent]
})
export class AppModule {}
